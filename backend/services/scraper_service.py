import requests
from bs4 import BeautifulSoup
import PyPDF2
import os

class ScraperService:
    def scrape_url(self, url):
        """Fetches a website or local file and returns clean, readable text."""
        import urllib.request
        from urllib.parse import urlparse

        try:
            html_content = ""
            
            # Detect local file:/// or raw local absolute path
            if url.startswith('file:///') or (os.name == 'nt' and ':' in url and not url.startswith('http')):
                # Convert file:///D:/path... to D:/path... 
                local_path = url.replace('file:///', '')
                if os.name == 'nt' and local_path.startswith('/'):
                    local_path = local_path[1:] # Strip leading slash for Windows paths
                
                with open(local_path, 'r', encoding='utf-8', errors='ignore') as f:
                    html_content = f.read()
            else:
                # Standard HTTP/HTTPS request
                headers = {'User-Agent': 'Mozilla/5.0'}
                response = requests.get(url, headers=headers, timeout=10, verify=False)
                html_content = response.text
            
            if not html_content:
                return None
                
            soup = BeautifulSoup(html_content, 'html.parser')
            
            for element in soup(["script", "style"]):
                element.decompose()
            
            clean_text = soup.get_text(separator=' ', strip=True)
            print(f"[Scraper] SUCCESSFULLY cleaned {len(clean_text)} chars from {url}")
            return clean_text
            
        except Exception as e:
            print(f"Error scraping {url}: {e}")
            return None

    def extract_file(self, temp_path, original_filename):
        """Extracts text from uploaded PDF or TXT files."""
        text = ""
        try:
            if original_filename.lower().endswith('.pdf'):
                with open(temp_path, 'rb') as f:
                    reader = PyPDF2.PdfReader(f)
                    for page in reader.pages:
                        extracted = page.extract_text()
                        if extracted:
                            text += extracted + "\n"
            else:
                # Fallback text read
                with open(temp_path, 'r', encoding='utf-8', errors='ignore') as f:
                    text = f.read()
            return text.strip()
        except Exception as e:
            print(f"Error extracting {original_filename}: {e}")
            return None

    def crawl_website(self, base_url, max_pages=100):
        """Recursively crawls a website or local directory to index all pages within the same domain/folder."""
        from urllib.parse import urljoin, urlparse
        import requests
        from bs4 import BeautifulSoup
        import time
        import os

        # Detect and Normalize local file paths
        is_local = base_url.startswith('file:///') or (os.name == 'nt' and ':' in base_url and not base_url.startswith('http'))
        
        if is_local:
            # Convert to a raw absolute path immediately
            path = base_url.replace('file:///', '')
            if os.name == 'nt' and path.startswith('/'):
                path = path[1:]
            clean_base = os.path.abspath(path).replace('\\', '/')
        else:
            clean_base = base_url.split('#')[0].split('?')[0].rstrip('/')
            
        visited = set()
        to_visit = [clean_base]
        pages_content = [] 
        
        # Domain or Base Directory for filtering
        domain = urlparse(base_url).netloc if not is_local else os.path.dirname(clean_base).replace('\\', '/')
        
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}

        print(f"[Crawler] Starting {'LOCAL' if is_local else 'WEB'} crawl for: {clean_base}")
        
        while to_visit and len(visited) < max_pages:
            url = to_visit.pop(0)
            if url in visited:
                continue
            
            visited.add(url)
            print(f"[Crawler] Visiting ({len(visited)}/{max_pages}): {url}")
            
            try:
                html = ""
                # 1. Fetch Page (Local or Web)
                if is_local:
                    if os.path.exists(url):
                        with open(url, 'r', encoding='utf-8', errors='ignore') as f:
                            html = f.read()
                else:
                    response = requests.get(url, headers=headers, timeout=10, verify=False)
                    if response.status_code == 200:
                        html = response.text

                if not html:
                    continue
                
                soup = BeautifulSoup(html, 'html.parser')
                
                # 2. Extract Text
                text_soup = BeautifulSoup(html, 'html.parser')
                for element in text_soup(["script", "style"]):
                    element.decompose()
                clean_text = text_soup.get_text(separator=' ', strip=True)
                
                if clean_text:
                    # For local files, we return the path as the URL for dashboard consistency
                    display_url = f"file:///{url}" if is_local else url
                    pages_content.append((display_url, clean_text))
                
                # 3. Discover Links
                for a in soup.find_all('a', href=True):
                    href = a['href']
                    if is_local:
                        # For local files, ignore external/mail/anchor links
                        if any(href.startswith(x) for x in ['http', 'mailto:', 'tel:', '#']):
                            continue
                        
                        folder = os.path.dirname(url)
                        full_url = os.path.normpath(os.path.join(folder, href)).replace('\\', '/')
                    else:
                        full_url = urljoin(url, href).split('#')[0].split('?')[0].rstrip('/')
                    
                    # Filter same domain/folder
                    if is_local:
                        # Stay within the same root directory and only follow .html files
                        if full_url.startswith(domain) and full_url.lower().endswith('.html'):
                            if full_url not in visited and full_url not in to_visit:
                                to_visit.append(full_url)
                    else:
                        parsed = urlparse(full_url)
                        if parsed.netloc == domain and parsed.scheme in ['http', 'https']:
                            if not any(full_url.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.exe', '.css', '.js']):
                                if full_url not in visited and full_url not in to_visit:
                                    to_visit.append(full_url)
                
                if not is_local:
                    time.sleep(0.1) 
                
            except Exception as e:
                print(f"[Crawler] Error on {url}: {e}")
                continue
        
        print(f"[Crawler] Finished. Total pages indexed: {len(pages_content)}")
        return pages_content