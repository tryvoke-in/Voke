import requests
import time
import threading
import winsound
import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def play_alarm_for_2_mins():
    # 80 loops * 1.5s = 120 seconds (2 mins)
    for _ in range(80):
        winsound.Beep(1500, 1000)
        time.sleep(0.5)

def send_notification(seat_no, mother_name, filename):
    # 1. PC Alarm (Beep sound for 2 mins in a background thread)
    t = threading.Thread(target=play_alarm_for_2_mins)
    t.start()
    
    # 2. Push Notification & Email with PDF attached (Free via ntfy.sh)
    try:
        topic_url = "https://ntfy.sh/voke_sppu_result_9529553010"
        
        headers = {
            "Title": f"Result for {seat_no} ({mother_name})!",
            "Email": "nikhilbhor201@gmail.com",
            "Filename": filename
        }
        with open(filename, "rb") as f:
            requests.post(topic_url, data=f, headers=headers)
        print(f"Sent push notification and email with {filename} attached!")
    except Exception as e:
        print("Failed to send notification:", e)

def fetch_result(seat_no, mother_name):
    url = "https://onlineresults.unipune.ac.in/SPPU%20ONLINE%20RESULT%20DISPLAY"
    
    headers = {
        "Origin": "https://onlineresults.unipune.ac.in",
        "Referer": "https://onlineresults.unipune.ac.in/result/dashboard/default",
        "User-Agent": "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Ch-Ua": "\"Not;A=Brand\";v=\"8\", \"Chromium\";v=\"150\", \"Brave\";v=\"150\"",
        "Sec-Ch-Ua-Mobile": "?1",
        "Sec-Ch-Ua-Platform": "\"Android\"",
        "Upgrade-Insecure-Requests": "1"
    }

    try:
        with open(os.path.join(SCRIPT_DIR, "payload.json"), "r") as f:
            payload = json.load(f)
    except FileNotFoundError:
        print("payload.json not found! Please run get_payload.py and solve the captcha first.")
        return "INVALID_CAPTCHA"

    files = {
        "PatternID": (None, payload.get("PatternID", "")),
        "PatternName": (None, payload.get("PatternName", "")),
        "SeatNo": (None, seat_no),
        "MotherName": (None, mother_name),
        "OrgCaptchaText": (None, payload.get("OrgCaptchaText", "")),
        "CaptchaImageSTR": (None, payload.get("CaptchaImageSTR", "")),
        "CaptchaText": (None, payload.get("CaptchaText", ""))
    }

    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Attempting to fetch result for {seat_no} - {mother_name}...")
    try:
        response = requests.post(url, headers=headers, files=files, timeout=80)
        print("Status Code:", response.status_code)
        
        if response.status_code == 200:
            if response.content.startswith(b"%PDF"):
                output_dir = os.path.join(SCRIPT_DIR, "All_Student_Data")
                os.makedirs(output_dir, exist_ok=True)
                filename = os.path.join(output_dir, f"result_{seat_no}.pdf")
                with open(filename, "wb") as f:
                    f.write(response.content)
                print(f"Success! Response saved to {filename}")
                return True
            else:
                content_lower = response.text.lower()
                if "took too long to respond" in content_lower or "site can't be reached" in content_lower:
                    print("Server returned a timeout or connection error page. Will retry.")
                    return False
                print("Received 200 OK but content is not a PDF. Captcha likely expired or session invalid.")
                return "INVALID_CAPTCHA"
            
        elif response.status_code in [500, 502, 503, 504]:
            print(f"Server error {response.status_code}. The university site is down. Will retry.")
            return False
        else:
            print(f"Failed with status code: {response.status_code}. Will retry.")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"Network request failed: {e}")
        return False

def main():
    with open(os.path.join(SCRIPT_DIR, "targets.json"), "r") as f:
        targets = json.load(f)
    
    # Optional: Load dynamic payload if we want, but currently hardcoded payload is used.
    # We will assume get_payload.py will update this script, or we can just read from payload.json!
    
    retry_delay = 5  # seconds
    
    print("Starting automated result fetcher with UNLIMITED retries...")
    
    while targets:
        for target in targets[:]:
            print(f"\n======================================")
            print(f"Fetching for: {target['seat_no']} / {target['mother_name']}")
            print(f"======================================")
            
            result = fetch_result(target['seat_no'], target['mother_name'])
            
            if result == True:
                filename = os.path.join(SCRIPT_DIR, "All_Student_Data", f"result_{target['seat_no']}.pdf")
                print(f"Finished successfully for {target['seat_no']}.")
                send_notification(target['seat_no'], target['mother_name'], filename)
                targets.remove(target)
            elif result == "INVALID_CAPTCHA":
                print("Captcha is invalid. Stopping entire script.")
                return
                
        if targets:
            print(f"\nSleeping for {retry_delay} seconds before next round...")
            time.sleep(retry_delay)
            
    print("ALL RESULTS DOWNLOADED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
