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

# 复制所有需要的文件到临时目录
echo "复制文件..."
cp -r manifest.json popup.html options.html ai-analysis.html $TMP_DIR/
cp -r js css images _locales $TMP_DIR/

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
else
  echo "构建失败: 未找到ZIP文件"
fi 