import os
import re
from pathlib import Path

class ImageCollector:
    def __init__(self):
        # 配置项
        self.VAULT_PATH = "."  
        self.OUTPUT_FILE = "image-collection.md"
        self.IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'}
        self.EXCLUDE_DIRS = {'.git', '.obsidian', 'node_modules'}
        self.EXISTING_IMAGES = set()

    def is_image_file(self, file_path: str) -> bool:
        return Path(file_path).suffix.lower() in self.IMAGE_EXTENSIONS

    def should_skip_dir(self, dir_name: str) -> bool:
        return dir_name in self.EXCLUDE_DIRS

    def collect_images(self) -> set:
        image_files = set()
        vault_path = Path(self.VAULT_PATH).resolve()

        for root, dirs, files in os.walk(vault_path):
            dirs[:] = [d for d in dirs if not self.should_skip_dir(d)]
            
            for file in files:
                if self.is_image_file(file):
                    abs_path = Path(root) / file
                    rel_path = abs_path.relative_to(vault_path)
                    image_files.add(str(rel_path))

        return image_files

    def create_markdown(self, image_files: set):
        output_path = Path(self.OUTPUT_FILE)
        
        content = ["# Image Collection\n"]
        content.append("*This file was automatically generated to help upload images.*\n\n")
        
        # 使用 Obsidian Wiki 链接格式
        for img_path in sorted(image_files):
            filename = Path(img_path).name
            content.append(f"![[{filename}]]")  # 修改为 Wiki 链接格式，并去掉换行符

        # 写入文件，确保内容在同一行
        output_path.write_text('\n'.join(content), encoding='utf-8')
        print(f"Created {self.OUTPUT_FILE} with {len(image_files)} images")

    def run(self):
        try:
            print("Collecting images...")
            image_files = self.collect_images()
            
            if not image_files:
                print("No images found!")
                return
            
            print(f"Found {len(image_files)} images")
            self.create_markdown(image_files)
            
        except Exception as e:
            print(f"Error: {str(e)}")

if __name__ == "__main__":
    collector = ImageCollector()
    collector.run() 