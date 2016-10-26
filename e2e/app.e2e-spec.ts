import { CypherpunkBrowserExtensionPage } from './app.po';

describe('cypherpunk-browser-extension App', function() {
  let page: CypherpunkBrowserExtensionPage;

  beforeEach(() => {
    page = new CypherpunkBrowserExtensionPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
