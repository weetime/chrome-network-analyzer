# 代码格式化指南

本项目使用 Prettier 和 ESLint 来保持代码风格一致性和质量。

## 自动格式化设置

### 使用命令行格式化

运行以下命令格式化所有 JavaScript 文件：

```bash
npm run format
```

### 代码检查

运行以下命令检查代码问题：

```bash
npm run lint
```

自动修复可以修复的问题：

```bash
npm run lint:fix
```

### VS Code 集成

如果您使用 VS Code 编辑器，项目已配置了保存时自动格式化。确保安装以下扩展：

1. Prettier - Code formatter
2. ESLint

安装后重启 VS Code，然后在项目中编辑文件时，保存将自动格式化代码。

## 配置文件

- `.prettierrc` - Prettier 配置
- `.eslintrc.json` - ESLint 配置
- `.prettierignore` - 指定不进行格式化的文件
- `.vscode/settings.json` - VS Code 编辑器设置

## 手动格式化单个文件

在 VS Code 中，可以使用快捷键格式化当前文件：

- Windows/Linux: `Ctrl + Shift + F`
- macOS: `Shift + Option + F`

## 规则说明

主要代码风格规则：

- 使用单引号
- 缩进为 2 个空格
- 每行最大长度为 100 个字符
- 行尾使用分号
- 使用 ES6+ 特性
- 统一使用 Unix 换行符 (LF)