#!/bin/bash

# 脚本: 构建Chrome扩展ZIP包

echo "开始构建扩展..."

# 获取当前目录的绝对路径
CURRENT_DIR=$(pwd)
OUTPUT_ZIP="$CURRENT_DIR/chrome-network-analyzer.zip"

# 删除已存在的zip包
if [ -f "$OUTPUT_ZIP" ]; then
  echo "删除旧的ZIP包..."
  rm "$OUTPUT_ZIP"
fi

# 创建临时目录
TMP_DIR=$(mktemp -d)
echo "创建临时目录: $TMP_DIR"

# 复制manifest.json到临时目录
echo "复制manifest.json..."
cp manifest.json $TMP_DIR/

# 创建src目录结构
echo "创建src目录结构..."
mkdir -p "$TMP_DIR/src"

# 复制所需的主要文件到临时目录
echo "复制主要文件..."
cp -r src/popup.html src/options.html src/ai-analysis.html "$TMP_DIR/src/"
cp -r src/js src/css "$TMP_DIR/src/"

# 创建images目录并只复制必要的图片
echo "只复制必要的图片..."
mkdir -p "$TMP_DIR/src/images"

# 列出需要的图片文件
REQUIRED_IMAGES=(
  "icon16.png"
  "icon48.png"
  "icon128.png"
)

# 复制必要的图片文件
for img in "${REQUIRED_IMAGES[@]}"; do
  if [ -f "src/images/$img" ]; then
    cp "src/images/$img" "$TMP_DIR/src/images/"
  fi
done

# 确保复制manifest.json中引用的所有图像
echo "确保复制manifest.json中引用的图像..."
MANIFEST_IMAGES=$(grep -o '"src/[^"]*\.\(png\|jpg\|jpeg\|svg\|gif\)"' manifest.json | tr -d '"')
for img in $MANIFEST_IMAGES; do
  if [ -f "$img" ]; then
    # 确保目标目录存在
    target_dir="$TMP_DIR/$(dirname $img)"
    mkdir -p "$target_dir"
    cp "$img" "$TMP_DIR/$img"
  fi
done

# 复制_locales目录
echo "复制_locales目录..."
if [ -d "_locales" ]; then
  cp -r _locales "$TMP_DIR/"
fi

# 移动到临时目录并创建zip
echo "创建ZIP包: $OUTPUT_ZIP"
cd $TMP_DIR
zip -r "$OUTPUT_ZIP" ./* -x "*.DS_Store" -x "*.git*"

# 返回原目录
cd "$CURRENT_DIR"

# 清理
echo "清理临时文件..."
rm -rf $TMP_DIR

if [ -f "$OUTPUT_ZIP" ]; then
  echo "构建完成: $OUTPUT_ZIP"
  du -h "$OUTPUT_ZIP"
  echo "扩展大小减小了，不包含docs目录和不必要的图片"
else
  echo "构建失败: 未找到ZIP文件"
fi 