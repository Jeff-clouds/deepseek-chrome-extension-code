import os
import re
from pathlib import Path

class ImageLinkReplacer:
    def __init__(self):
        # 配置项
        self.SOURCE_PATH = "."  # 当前目录
        self.BASE_URL = "https://obsidian-jpeg.oss-cn-shenzhen.aliyuncs.com/obsidian-jpeg"
        self.IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'}

    def should_skip_dir(self, dir_name: str) -> bool:
        """检查是否应该跳过该目录"""
        return dir_name.startswith('.')

    def is_image_file(self, file_path: str) -> bool:
        """检查文件是否为图片"""
        return any(file_path.lower().endswith(ext) for ext in self.IMAGE_EXTENSIONS)

    def convert_to_online_url(self, image_name: str) -> str:
        """转换为在线 URL"""
        return f"{self.BASE_URL}/{image_name}"

    def process_file(self, file_path: Path) -> tuple[bool, int]:
        """处理单个文件中的图片链接"""
        try:
            content = file_path.read_text(encoding='utf-8')
            original_content = content
            replacements = 0

            # 处理 ![[file.png]] 格式
            wiki_matches = re.finditer(r'!\[\[(.*?)\]\]', content)
            for match in wiki_matches:
                image_name = match.group(1)
                if self.is_image_file(image_name):
                    online_url = self.convert_to_online_url(image_name)
                    new_link = f"![{image_name}]({online_url})"
                    content = content.replace(match.group(0), new_link)
                    replacements += 1

            # 处理 ![](file.png) 格式
            md_matches = re.finditer(r'!\[(.*?)\]\((.*?)\)', content)
            for match in md_matches:
                alt_text = match.group(1)
                image_path = match.group(2)
                if self.is_image_file(image_path):
                    image_name = os.path.basename(image_path)
                    if not image_path.startswith('http'):  # 只替换本地图片
                        online_url = self.convert_to_online_url(image_name)
                        new_link = f"![{alt_text}]({online_url})"
                        content = content.replace(match.group(0), new_link)
                        replacements += 1

            # 只有在内容发生变化时才写入文件
            if content != original_content:
                file_path.write_text(content, encoding='utf-8')
                return True, replacements
            
            return False, 0

        except Exception as e:
            print(f"Error processing file {file_path}: {str(e)}")
            return False, 0

    def process_all_files(self):
        """处理所有 Markdown 文件"""
        source_path = Path(self.SOURCE_PATH).resolve()
        total_files = 0
        modified_files = 0
        total_replacements = 0

        print("Starting to process Markdown files...")

        for root, dirs, files in os.walk(source_path):
            # 过滤掉以.开头的目录
            dirs[:] = [d for d in dirs if not self.should_skip_dir(d)]
            
            for file in files:
                if file.endswith('.md'):
                    total_files += 1
                    file_path = Path(root) / file
                    print(f"Processing: {file_path.relative_to(source_path)}")
                    
                    modified, replacements = self.process_file(file_path)
                    if modified:
                        modified_files += 1
                        total_replacements += replacements

        print(f"\nProcessing completed!")
        print(f"Total files processed: {total_files}")
        print(f"Files modified: {modified_files}")
        print(f"Total replacements made: {total_replacements}")

    def run(self):
        """运行主程序"""
        self.process_all_files()

if __name__ == "__main__":
    replacer = ImageLinkReplacer()
    replacer.run() 