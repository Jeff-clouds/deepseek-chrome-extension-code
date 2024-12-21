import os
from pathlib import Path
from datetime import datetime

class ImageDeleter:
    def __init__(self):
        # 配置项
        self.SOURCE_PATH = "."  # 当前目录
        self.IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'}
        self.LOG_FILE = "deleted_images_log.txt"
        self.deleted_files = []

    def should_skip_dir(self, dir_name: str) -> bool:
        """检查是否应该跳过该目录"""
        return dir_name.startswith('.')

    def is_image_file(self, file_path: str) -> bool:
        """检查文件是否为图片"""
        return any(file_path.lower().endswith(ext) for ext in self.IMAGE_EXTENSIONS)

    def collect_images(self) -> list:
        """收集所有图片文件的路径"""
        image_files = []
        source_path = Path(self.SOURCE_PATH).resolve()

        for root, dirs, files in os.walk(source_path):
            # 过滤掉以.开头的目录
            dirs[:] = [d for d in dirs if not self.should_skip_dir(d)]
            
            for file in files:
                if self.is_image_file(file):
                    file_path = Path(root) / file
                    image_files.append(file_path)

        return image_files

    def create_log(self):
        """创建删除日志"""
        if not self.deleted_files:
            return

        log_content = [
            f"Image Deletion Log - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n",
            f"Total files deleted: {len(self.deleted_files)}\n",
            "\nDeleted files:"
        ]
        
        for file_path in self.deleted_files:
            log_content.append(f"- {file_path}")

        log_path = Path(self.LOG_FILE)
        log_path.write_text('\n'.join(log_content), encoding='utf-8')
        print(f"\nLog file created: {self.LOG_FILE}")

    def delete_images(self):
        """删除图片文件"""
        image_files = self.collect_images()
        
        if not image_files:
            print("No image files found!")
            return

        print(f"\nFound {len(image_files)} image files:")
        for file_path in image_files:
            print(f"- {file_path}")

        # 安全确认
        confirmation = input(f"\nAre you sure you want to delete these {len(image_files)} files? (yes/no): ")
        if confirmation.lower() != 'yes':
            print("Operation cancelled.")
            return

        # 执行删除
        print("\nDeleting files...")
        for file_path in image_files:
            try:
                file_path.unlink()
                print(f"Deleted: {file_path}")
                self.deleted_files.append(str(file_path))
            except Exception as e:
                print(f"Error deleting {file_path}: {str(e)}")

        # 创建日志
        self.create_log()
        
        print(f"\nDeletion completed!")
        print(f"Total files deleted: {len(self.deleted_files)}")

    def run(self):
        """运行主程序"""
        try:
            print("Starting image deletion process...")
            self.delete_images()
        except Exception as e:
            print(f"Error: {str(e)}")

if __name__ == "__main__":
    deleter = ImageDeleter()
    deleter.run() 