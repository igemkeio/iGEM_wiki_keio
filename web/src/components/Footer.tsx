export default function Footer() {
  return (
    <footer className="pt-5 pb-5 footer py-5 mt-5 bg-dark text-white">
      <div className="container">
        <div className="row mb-4">
          <div className="col-lg-6 col-xs-12">
            <h4 className="mb-3">iGEM Keio</h4>
            <p>Keio University iGEM team — synthetic biology project wiki.</p>
          </div>
          <div className="col-lg-3 col-xs-12">
            <h4 className="mt-lg-0 mt-sm-3">Links</h4>
            <ul className="m-2 p-2">
              <li><a href="https://igem.org">iGEM</a></li>
              <li><a href="https://competition.igem.org/">Competition</a></li>
            </ul>
          </div>
          <div className="col-lg-3 col-xs-12">
            <h4 className="mt-lg-0 mt-sm-4 mb-3">Contact</h4>
            <p>Keio University, Japan</p>
          </div>
        </div>
        <hr />
        <div className="row mt-4">
          <div className="col">
            <p className="mb-0">
              <small>
                © 2025 - Content on this site is licensed under a{" "}
                <a
                  className="subfoot"
                  href="https://creativecommons.org/licenses/by/4.0/"
                  rel="license"
                >
                  Creative Commons Attribution 4.0 International license
                </a>
                .
              </small>
            </p>
            <p>
              <small>
                The repository used to create this website is available at{" "}
                <a href="https://github.com/jiku0730/iGEM_wiki_keio">
                  github.com/jiku0730/iGEM_wiki_keio
                </a>
                .
              </small>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
