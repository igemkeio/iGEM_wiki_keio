#!/usr/bin/env python3
"""
GitHub Pages用の静的サイトを生成するスクリプト
"""

import os
import shutil
from pathlib import Path
from flask import Flask, render_template
from flask_frozen import Freezer

# Flaskアプリの設定
template_folder = os.path.abspath('./wiki')
app = Flask(__name__, template_folder=template_folder)

# GitHub Pages用の設定
app.config['FREEZER_DESTINATION'] = 'docs'  # GitHub Pagesは docs フォルダを使用
app.config['FREEZER_RELATIVE_URLS'] = True
app.config['FREEZER_IGNORE_MIMETYPE_WARNINGS'] = True

freezer = Freezer(app)

@app.route('/')
def home():
    return render_template('pages/home.html')

@app.route('/<page>')
def pages(page):
    return render_template(str(Path('pages')) + '/' + page.lower() + '.html')

def build_static_site():
    """静的サイトをビルド"""
    
    # 既存のdocsフォルダを削除
    if os.path.exists('docs'):
        shutil.rmtree('docs')
    
    print("Building static site...")
    
    # 静的サイトを生成
    freezer.freeze()
    
    # staticファイルをコピー
    if os.path.exists('static'):
        shutil.copytree('static', 'docs/static', dirs_exist_ok=True)
    
    print(f"Static site built in 'docs' directory")
    print("Files generated:")
    for root, dirs, files in os.walk('docs'):
        level = root.replace('docs', '').count(os.sep)
        indent = ' ' * 2 * level
        print(f"{indent}{os.path.basename(root)}/")
        subindent = ' ' * 2 * (level + 1)
        for file in files:
            print(f"{subindent}{file}")

if __name__ == '__main__':
    build_static_site()
