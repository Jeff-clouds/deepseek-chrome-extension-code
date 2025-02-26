import base64
import os

def image_to_base64(image_path):
    try:
        # 以二进制方式读取图片
        with open(image_path, 'rb') as image_file:
            # 将图片转换为base64编码
            base64_data = base64.b64encode(image_file.read())
            # 将bytes转换为字符串
            base64_string = base64_data.decode('utf-8')
            return base64_string
    except Exception as e:
        print(f"转换{image_path}过程中出现错误: {str(e)}")
        return None

def get_image_files(directory):
    # 支持的图片格式
    image_extensions = ('.webp', '.png', '.jpg', '.jpeg')
    image_files = []
    
    # 获取当前目录下所有文件
    for file in os.listdir(directory):
        if file.lower().endswith(image_extensions):
            image_files.append(file)
    
    return image_files

# 使用示例
if __name__ == "__main__":
    # 获取当前脚本所在目录
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 获取所有图片文件
    image_files = get_image_files(current_dir)
    
    if not image_files:
        print("当前目录下没有找到支持的图片文件(.webp, .png, .jpg, .jpeg)")
    else:
        print(f"找到以下图片文件：{image_files}")
        
        # 处理每个图片文件
        for image_file in image_files:
            image_path = os.path.join(current_dir, image_file)
            base64_string = image_to_base64(image_path)
            
            if base64_string:
                # 生成输出文件名（将图片扩展名替换为.txt）
                output_filename = os.path.splitext(image_file)[0] + '_base64.txt'
                output_path = os.path.join(current_dir, output_filename)
                
                # 保存base64编码到文件
                with open(output_path, 'w') as f:
                    f.write(base64_string)
                print(f"已将 {image_file} 的base64编码保存到 {output_filename}")
