$port = 50505
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
} catch {
    exit
}

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' 
})[0]

function Await($winRtTask, $resultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($resultType)
    $netTask = $asTask.Invoke($null, @($winRtTask))
    $netTask.Wait(-1) | Out-Null
    $netTask.Result
}

$lastTitle = ""
$lastThumb = ""

while ($true) {
    try {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response
        $res.Headers.Add('Access-Control-Allow-Origin', '*')
        
        $action = $req.Url.AbsolutePath.Trim('/')
        $status = '{"error":"not_found"}'
        
        try {
            [void][Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
            $manager = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
            $sessions = $manager.GetSessions()
            
            $target = $sessions | Where-Object { $_.SourceAppUserModelId -match "(?i)yandex" } | Select-Object -First 1
            
            if ($target) {
                # Выполняем команду, если это не просто запрос статуса
                if ($action -eq 'playpause') { Await ($target.TryTogglePlayPauseAsync()) ([System.Boolean]) | Out-Null }
                elseif ($action -eq 'next') { Await ($target.TrySkipNextAsync()) ([System.Boolean]) | Out-Null }
                elseif ($action -eq 'prev') { Await ($target.TrySkipPreviousAsync()) ([System.Boolean]) | Out-Null }
                
                # Получаем статус
                $playbackInfo = $target.GetPlaybackInfo()
                $mediaProperties = Await ($target.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
                
                $title = $mediaProperties.Title
                $artist = $mediaProperties.Artist
                $isPlaying = ($playbackInfo.PlaybackStatus -eq 4)
                
                # Время
                $position = $playbackInfo.Position.TotalMilliseconds
                $endTime = $playbackInfo.EndTime
                $startTime = $playbackInfo.StartTime
                $duration = ($endTime - $startTime).TotalMilliseconds
                
                # Обложка (кэшируем, чтобы не грузить процессор каждую секунду)
                $thumbBase64 = $lastThumb
                if ($lastTitle -ne $title -or !$thumbBase64) {
                    $lastTitle = $title
                    $thumbRef = $mediaProperties.Thumbnail
                    if ($thumbRef) {
                        try {
                            $stream = Await ($thumbRef.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
                            $reader = New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
                            Await ($reader.LoadAsync($stream.Size)) ([uint32]) | Out-Null
                            $bytes = New-Object byte[] $stream.Size
                            $reader.ReadBytes($bytes)
                            $thumbBase64 = [Convert]::ToBase64String($bytes)
                            $lastThumb = $thumbBase64
                            $reader.Dispose()
                            $stream.Dispose()
                        } catch {
                            $thumbBase64 = ""
                        }
                    } else {
                        $thumbBase64 = ""
                    }
                }
                
                $status = @{
                    title = $title
                    artist = $artist
                    isPlaying = $isPlaying
                    position = $position
                    duration = $duration
                    cover = $thumbBase64
                } | ConvertTo-Json -Compress
            }
        } catch {
            $status = '{"error":"exception"}'
        }

        $buffer = [System.Text.Encoding]::UTF8.GetBytes($status)
        $res.ContentLength64 = $buffer.Length
        $res.OutputStream.Write($buffer, 0, $buffer.Length)
        $res.Close()
    } catch {}
}