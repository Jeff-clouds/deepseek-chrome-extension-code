import os
import shutil
from pathlib import Path
from datetime import datetime

class ImageBackup:
    def __init__(self):
        # 配置项
        self.SOURCE_PATH = "."  # 当前目录
        self.BACKUP_PATH = r"E:\Desktop\Obsidian-pic"  # 备份目录
        self.LOG_FILE = "image_backup_paths.txt"  # 日志文件
        self.IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'}
        self.EXCLUDE_DIRS = {'.git', '.obsidian', 'node_modules'}

    def is_image_file(self, file_path: str) -> bool:
        """检查是否为图片文件"""
        return Path(file_path).suffix.lower() in self.IMAGE_EXTENSIONS

    def should_skip_dir(self, dir_name: str) -> bool:
        """检查是否应该跳过该目录"""
        return dir_name in self.EXCLUDE_DIRS

    def collect_and_backup_images(self):
        """收集并备份图片文件"""
        source_path = Path(self.SOURCE_PATH).resolve()
        backup_path = Path(self.BACKUP_PATH)
        log_entries = []
        
        # 确保备份目录存在
        backup_path.mkdir(parents=True, exist_ok=True)
        
        # 记录开始时间
        start_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entries.append(f"Backup started at: {start_time}\n")
        
        try:
            for root, dirs, files in os.walk(source_path):
                # 过滤掉不需要的目录
                dirs[:] = [d for d in dirs if not self.should_skip_dir(d)]
                
                for file in files:
                    if self.is_image_file(file):
                        # 获取源文件的完整路径
                        source_file = Path(root) / file
                        rel_path = source_file.relative_to(source_path)
                        
                        # 创建目标文件路径
                        dest_file = backup_path / file
                        
                        # 如果目标文件已存在，添加数字后缀
                        counter = 1
                        while dest_file.exists():
                            stem = dest_file.stem
                            # 移除可能存在的旧的数字后缀
                            base_stem = stem.split('_')[0] if '_' in stem else stem
                            dest_file = backup_path / f"{base_stem}_{counter}{dest_file.suffix}"
                            counter += 1
                        
                        # 复制文件
                        shutil.copy2(source_file, dest_file)
                        
                        # 记录路径映射
                        log_entries.append(f"Original: {rel_path}\nBackup: {dest_file.name}\n")
                        print(f"Backed up: {rel_path} -> {dest_file.name}")
            
            # 记录结束时间
            end_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            log_entries.append(f"\nBackup completed at: {end_time}")
            
            # 写入日志文件
            log_file = backup_path / self.LOG_FILE
            log_file.write_text('\n'.join(log_entries), encoding='utf-8')
            
            print(f"\nBackup completed! Log file created at: {log_file}")
            
        except Exception as e:
            print(f"Error during backup: {str(e)}")

    def run(self):
        """运行主程序"""
        print("Starting image backup process...")
        self.collect_and_backup_images()

if __name__ == "__main__":
    backup = ImageBackup()
    backup.run() 
