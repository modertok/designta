# Публікація ThreadScope на GitHub Pages одним запуском.
# Токен вводите ви самі (приховано); він нікуди не зберігається і не змінює ваш основний акаунт у git/gh.
# Потрібні права токена: repo + workflow.
#
# Запуск (PowerShell, у папці проєкту):  .\publish.ps1

param(
  [string]$User = "modertok",
  [string]$Repo = "designta"
)

$ErrorActionPreference = "Stop"

# якщо папку розпаковано з zip без git — ініціалізуємо репозиторій (нейтральний автор; змінити можна пізніше)
if (-not (Test-Path ".git")) {
  git init -b main | Out-Null
  git config user.name "ThreadScope"
  git config user.email "threadscope@users.noreply.github.com"
  git add -A
  git commit -q -m "Initial commit: ThreadScope landing, demo web app and browser extension mockup"
}

if (-not $User) { $User = Read-Host "GitHub-логін (університетський акаунт)" }
$sec = Read-Host "Токен (repo + workflow)" -AsSecureString
$token = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))

$h = @{ Authorization = "Bearer $token"; Accept = "application/vnd.github+json"; "X-GitHub-Api-Version" = "2022-11-28"; "User-Agent" = "threadscope-publish" }
function Api($method, $path, $body) {
  $args = @{ Method = $method; Uri = "https://api.github.com$path"; Headers = $h }
  if ($body) { $args.Body = ($body | ConvertTo-Json); $args.ContentType = "application/json" }
  Invoke-RestMethod @args
}

# 0. перевірка, що токен належить очікуваному акаунту
$me = Api Get "/user"
if ($me.login -ne $User) { throw "Токен належить '$($me.login)', а не '$User'. Перевірте логін/токен." }

# 1. репозиторій (публічний — потрібно для безкоштовних Pages)
try {
  Api Post "/user/repos" @{ name = $Repo; private = $false; description = "ThreadScope: лендінг, демо вебзастосунку та макет розширення для аналізу контенту Threads" } | Out-Null
  Write-Host "Репозиторій створено." -ForegroundColor Green
} catch { Write-Host "Репозиторій уже існує або створення пропущено: $($_.Exception.Message)" -ForegroundColor Yellow }

# 2. push разовим заголовком авторизації (кеш облікових даних основного акаунта не чіпається)
$b64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${User}:$token"))
git remote remove origin 2>$null
git remote add origin "https://github.com/$User/$Repo.git"
git -c credential.helper= -c "http.extraheader=Authorization: Basic $b64" push -u origin main

# 3. вмикаємо Pages із джерелом GitHub Actions
try { Api Post "/repos/$User/$Repo/pages" @{ build_type = "workflow" } | Out-Null; Write-Host "Pages увімкнено." -ForegroundColor Green }
catch { Write-Host "Pages: $($_.Exception.Message) (можливо, уже увімкнено)" -ForegroundColor Yellow }

# 4. перезапуск збірки (перший push міг пройти до вмикання Pages)
Start-Sleep -Seconds 4
try { Api Post "/repos/$User/$Repo/actions/workflows/deploy.yml/dispatches" @{ ref = "main" } | Out-Null; Write-Host "Збірку запущено." -ForegroundColor Green }
catch { Write-Host "Запуск збірки: $($_.Exception.Message)" -ForegroundColor Yellow }

$token = $null
Write-Host ""
Write-Host "Готово. Сайт з'явиться за 1–2 хвилини: https://$User.github.io/$Repo/" -ForegroundColor Cyan
Write-Host "Прогрес збірки: https://github.com/$User/$Repo/actions"
Write-Host "Після завершення відкличте токен: GitHub → Settings → Developer settings → Tokens."
