from os import path
from pathlib import Path

from flask import Flask, render_template
from flask_frozen import Freezer


template_folder = path.abspath('./wiki')

app = Flask(__name__, template_folder=template_folder)
#app.config['FREEZER_BASE_URL'] = environ.get('CI_PAGES_URL')
app.config['FREEZER_DESTINATION'] = 'public'
app.config['FREEZER_RELATIVE_URLS'] = True
app.config['FREEZER_IGNORE_MIMETYPE_WARNINGS'] = True
freezer = Freezer(app)

@app.cli.command()
def freeze():
    freezer.freeze()

@app.cli.command()
def serve():
    freezer.run()
@app.route('/')
def home():
    return render_template('pages/home.html')

@app.route('/ja/')
def home_ja():
    return render_template('pages/ja/home.html')

@app.route('/<page>')
def pages(page):
    return render_template(f'pages/{page}.html')

@app.route('/ja/<page>')
def pages_ja(page):
    try:
        return render_template(f'pages/ja/{page}.html')
    except:
        # 日本語ページが存在しない場合は英語版にリダイレクト
        return redirect(url_for('pages', page=page))

# Main Function, Runs at http://0.0.0.0:8080
if __name__ == "__main__":
    app.run(port=8080)
