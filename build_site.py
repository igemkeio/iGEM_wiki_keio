#!/usr/bin/env python3

import os
import shutil
from app import app, freezer

if __name__ == '__main__':
    # Clean up existing directories
    if os.path.exists('public'):
        shutil.rmtree('public')
    if os.path.exists('docs'):
        shutil.rmtree('docs')
    
    print("Building static site...")
    
    with app.app_context():
        try:
            freezer.freeze()
            print("✅ Static site generated in 'public' directory")
            
            # Rename files to add .html extension (except index.html and static files)
            print("Adding .html extensions to files...")
            for root, dirs, files in os.walk('public'):
                # Skip static directory
                if 'static' in root:
                    continue
                    
                for file in files:
                    if file != 'index.html' and not file.endswith('.html'):
                        old_path = os.path.join(root, file)
                        new_path = os.path.join(root, file + '.html')
                        os.rename(old_path, new_path)
                        print(f"  Renamed {file} → {file}.html")
            
            # Copy to docs
            shutil.copytree('public', 'docs')
            print("✅ Copied to 'docs' directory for GitHub Pages")
            
            # List generated files
            print("\nGenerated files:")
            for root, dirs, files in os.walk('docs'):
                level = root.replace('docs', '').count(os.sep)
                indent = ' ' * 2 * level
                print(f"{indent}{os.path.basename(root)}/")
                subindent = ' ' * 2 * (level + 1)
                for file in files:
                    print(f"{subindent}{file}")
                    
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
