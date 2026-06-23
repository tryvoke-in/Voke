import shutil

src = "/Users/priyanshu/.gemini/antigravity-ide/brain/222194ec-1fd1-432c-afa9-fa9e9f7f10bc/media__1782218893102.png"
dst = "/Users/priyanshu/Downloads/Priyanshu's Space/Voke.in/Voke/public/images/voke_logo.png"

try:
    shutil.copy2(src, dst)
    print("Copied successfully.")
except Exception as e:
    print(f"Error copying: {e}")
