#!/usr/bin/env python3

import os
import shutil
import glob

def generate_static_files():
    """Generate static HTML files from templates without Flask routing"""
    # Clean up existing directories
    if os.path.exists('public'):
        shutil.rmtree('public')
    if os.path.exists('docs'):
        shutil.rmtree('docs')
    
    # Create public directory
    os.makedirs('public', exist_ok=True)
    
    print("Building static site...")
    
    # Copy static files
    if os.path.exists('static'):
        shutil.copytree('static', 'public/static')
        print("✅ Static files copied")
    
    # Generate HTML files from templates
    template_dir = 'wiki/pages'
    if os.path.exists(template_dir):
        print("Generating HTML files from templates...")
        
        # Create index.html (home page)
        home_template = os.path.join(template_dir, 'home.html')
        if os.path.exists(home_template):
            shutil.copy2(home_template, 'public/index.html')
            print("  Generated index.html")
        
        # Generate other pages with .html extension
        for template_file in glob.glob(f'{template_dir}/*.html'):
            if os.path.basename(template_file) != 'home.html':
                basename = os.path.basename(template_file)
                # Copy template to public with .html extension
                shutil.copy2(template_file, f'public/{basename}')
                print(f"  Generated {basename}")
    
    # Copy to docs directory for GitHub Pages
    if os.path.exists('public'):
        shutil.copytree('public', 'docs')
        print("✅ Copied to 'docs' directory for GitHub Pages")
        
        # List generated files
        print("\nGenerated files:")
        for root, dirs, files in os.walk('docs'):
            level = root.replace('docs', '').count(os.sep)
            indent = ' ' * 2 * level
            print(f"{indent}{os.path.basename(root)}/")
            subindent = ' ' * 2 * (level + 1)
            for file in sorted(files):
                print(f"{subindent}{file}")
        
        return True
    return False

if __name__ == '__main__':
    try:
        success = generate_static_files()
        if success:
            print("✅ Static site build completed successfully!")
        else:
            print("❌ Static site build failed!")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
