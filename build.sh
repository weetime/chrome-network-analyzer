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

# 复制所需的主要文件到临时目录
echo "复制主要文件..."
cp -r manifest.json popup.html options.html ai-analysis.html $TMP_DIR/
cp -r js css _locales $TMP_DIR/

# 创建images目录并只复制必要的图片
echo "只复制必要的图片..."
mkdir -p "$TMP_DIR/images"

# 列出需要的图片文件
REQUIRED_IMAGES=(
  "icon16.png"
  "icon48.png"
  "icon128.png"
)

# 复制必要的图片文件
for img in "${REQUIRED_IMAGES[@]}"; do
  if [ -f "images/$img" ]; then
    cp "images/$img" "$TMP_DIR/images/"
  fi
done

# 确保复制manifest.json中引用的所有图像
echo "确保复制manifest.json中引用的图像..."
MANIFEST_IMAGES=$(grep -o '"[^"]*\.\(png\|jpg\|jpeg\|svg\|gif\)"' manifest.json | tr -d '"')
for img in $MANIFEST_IMAGES; do
  # 检查图像路径是否包含"images/"
  if [[ $img == images/* ]]; then
    img_name=${img#images/}
    # 确保目标目录存在
    mkdir -p "$TMP_DIR/$(dirname $img)"
    if [ -f "$img" ]; then
      cp "$img" "$TMP_DIR/$img"
    fi
  fi
done

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