开发者运行说明 (README_DEV)

目的
- 说明如何在本地启动并联调前端（Vite）与后端（Django）。

先决条件
- Python 3.10+ 已安装（推荐使用系统 Python 或 conda）
- Node.js + npm 已安装（Windows 下 npm 执行使用 `npm.cmd`）
- 可选：Redis（用于 Celery）

快速开始（PowerShell）
1) 克隆仓库并切换到项目根：

    Set-Location -Path "D:\MUST_proj\SW_Practices\AI_ECOMMERCE_SYSTEM"

2) 创建并激活 Python 虚拟环境

    # 创建 venv
    python -m venv .venv

    # PowerShell 可能禁止运行脚本，如果激活脚本被阻止，先允许当前用户执行策略（只需运行一次）
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

    # 激活
    .venv\Scripts\Activate.ps1

    # 如果不想改 ExecutionPolicy，可以在 cmd 中激活：
    .venv\Scripts\activate.bat

3) 安装 Python 依赖

    pip install -r requirements.txt

4) 运行数据库迁移与开发服务器

    python manage.py migrate
    python manage.py createsuperuser   # 可选
    python manage.py runserver 8000

   - Django dev server 默认绑定 `http://127.0.0.1:8000/`。
   - 如果访问首页出现 500 并提示 `TemplateDoesNotExist: core_ecommerce/homepage.html`，说明模板期望位于 `core_ecommerce/templates/core_ecommerce/homepage.html`（app-scoped path）。已在仓库中添加该模板副本。

5) 启动前端（另开一个终端）

    Set-Location -Path "D:\MUST_proj\SW_Practices\AI_ECOMMERCE_SYSTEM\frontend"
    npm.cmd install --legacy-peer-deps
    npm.cmd run dev

   - Vite 默认在 `http://localhost:5173/` 启动。
   - 前端读取环境变量前缀为 `VITE_`，示例文件位于 `frontend/src/env.txt`。
   - 若需修改后端地址，可在 `frontend/.env` 或 `frontend/src/env.txt` 中设定 `VITE_API_BASE="http://localhost:8000"`，在前端通过 `import.meta.env.VITE_API_BASE` 读取。

调试与联调注意事项
- CORS：开发环境中 `settings.py` 已设置 `CORS_ALLOW_ALL_ORIGINS = True`，前端开发时跨域请求应被允许。但生产环境请改为允许特定域名。
- PowerShell 执行策略：Windows PowerShell 可能禁止执行 `.ps1` 激活脚本（导致激活 venv 出错）。解决方案：
  - 以管理员或当前用户级别运行 `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`，或
  - 在 cmd 中运行 `.\.venv\Scripts\activate.bat` 来激活虚拟环境。

额外：Celery + Redis
- 若使用 Celery，设置环境变量：

    setx CELERY_BROKER_URL "redis://localhost:6379/0"

- 启动 Redis（本机或 Docker）：

    docker run -p 6379:6379 -d redis:7

- 启动 worker：

    celery -A celery_app worker --loglevel=info

已在代码中做的改动（为本地运行修复）
- 在 `core_ecommerce/api_views.py` 中增加了两个简化的 API：`UserBehaviorAPI` 与 `RecommendationAPI`，以修复 `urls.py` 中对这些路由的引用，避免导入时崩溃。
- 将 `core_ecommerce/templates/homepage.html` 的副本放在 `core_ecommerce/templates/core_ecommerce/homepage.html`（app-scoped），以匹配 Django 的模板查找路径，修复首页 500 错误。

常见问题
- "无法加载 Activate.ps1，因为在此系统上禁止运行脚本"：请参考上面的 ExecutionPolicy 说明。
- "module 'core_ecommerce.api_views' has no attribute 'UserBehaviorAPI'"：说明代码中引用了不存在的类，已通过添加简易实现修复。

下一步建议（可选）
- 将前端生产构建（`npm run build`）输出部署到 CDN 或放入 Django 的静态目录中；或配置 Nginx 作为静态文件服务器，后端使用 Gunicorn/Uvicorn。
- 若需要，我可以将 Django 项目搬入 `backend/` 子目录并自动调整 `BASE_DIR`、`ROOT_URLCONF` 等配置（这会改动路径与导入，请在 Git 分支上操作）。

如果你希望我继续：
- 我可以修复仓库中其他尚缺的模板（例如 `product_list.html` 等），并把可用的页面样式/数据示例补齐；或
- 我可以把所有修改提交到一个新分支并创建 PR；或
- 运行一轮自动化测试（如果 repo 包含测试）。

---
