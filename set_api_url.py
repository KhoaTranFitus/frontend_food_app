# set_api_url.py (trong thư mục Frontend)
import netifaces
import os

# Lấy IP LAN hiện tại của máy tính
def get_local_ip():
    try:
        # Tìm interface mặc định đang dùng
        gws = netifaces.gateways()
        default_interface = gws['default'][netifaces.AF_INET][1]
        return netifaces.ifaddresses(default_interface)[netifaces.AF_INET][0]['addr']
    except:
        return 'localhost' # Fallback nếu không tìm thấy

if __name__ == "__main__":
    local_ip = get_local_ip()
    api_url = f"http://{local_ip}:5000/api"

    # Ghi vào file .env
    env_path = os.path.join(os.path.dirname(__file__), '.env')

    with open(env_path, 'w') as f:
        f.write(f'EXPO_PUBLIC_API_BASE_URL="{api_url}"\n')

    print(f"✅ Đã cập nhật API URL trong .env: {api_url}")