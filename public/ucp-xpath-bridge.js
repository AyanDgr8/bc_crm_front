(function () {
  var MESSAGE_TYPE = 'UCP_INCOMING_ROUTING_VALUE';
  var CONTAINER_XPATH = '/html/body/div[2]/div/main/div/div[1]/div/div[3]/div[1]/div/div[3]/div';
  var XPATH = '/html/body/div[2]/div/main/div/div[1]/div/div[3]/div[1]/div/div[3]/div/div[2]/p';
  var CONTAINER_SELECTOR = '#main-content > div > div.sc-LUFyL.eterbs > div > div.embedded-main-content-container > div.sc-emTisi.hqWjHr > div > div.embedded-incoming-call-routing > div';
  var SELECTOR = '#main-content > div > div.sc-LUFyL.eterbs > div > div.embedded-main-content-container > div.sc-emTisi.hqWjHr > div > div.embedded-incoming-call-routing > div > div.embedded-incoming-call-routing-row-value > p';
  var LOOSE_SELECTOR = '.embedded-incoming-call-routing .embedded-incoming-call-routing-row-value p, [class*="embedded-incoming-call-routing"] [class*="embedded-incoming-call-routing-row-value"] p';
  var lastValue = '';

  function findByXPath(xpath) {
    try {
      return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    } catch (error) {
      return null;
    }
  }

  function readRoutingValue() {
    var container = findByXPath(CONTAINER_XPATH) || document.querySelector(CONTAINER_SELECTOR);
    var element = (container && (container.querySelector('.embedded-incoming-call-routing-row-value p') || container.querySelector('div:nth-child(2) p')))
      || findByXPath(XPATH)
      || document.querySelector(SELECTOR)
      || document.querySelector(LOOSE_SELECTOR);

    return String((element && (element.textContent || element.innerText)) || '').trim();
  }

  function publishRoutingValue() {
    var rawText = readRoutingValue();
    if (!rawText || rawText === lastValue) return;

    lastValue = rawText;

    window.parent.postMessage({
      type: MESSAGE_TYPE,
      rawText: rawText,
      containerXpath: CONTAINER_XPATH,
      xpath: XPATH,
      selector: SELECTOR
    }, '*');

    console.info('[UCP XPath Bridge] posted incoming routing value', {
      rawText: rawText,
      containerXpath: CONTAINER_XPATH,
      xpath: XPATH,
      selector: SELECTOR
    });
  }

  window.setInterval(publishRoutingValue, 300);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', publishRoutingValue);
  } else {
    publishRoutingValue();
  }
}());
