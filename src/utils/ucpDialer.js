// src/utils/ucpDialer.js

const NUMBER_INSERT_BUTTON_XPATH = '/html/body/div[2]/div/main/div/div[2]/aside/div[2]/div[1]/i';
const NUMBER_INSERT_INPUT_XPATH = '/html/body/div[2]/div/main/div/div[2]/aside/div[2]/div[1]/input';
const NUMBER_CALL_BUTTON_XPATH = '/html/body/div[2]/div/main/div/div[2]/aside/div[2]/div[1]/div/button/i';
const PRIMARY_DIAL_INPUT_XPATH = '/html/body/div[2]/div/main/div/div[1]/div/div[2]/div/input';
const PRIMARY_DIAL_INPUT_SELECTOR = '#dialed-number-input';
const NUMBER_INSERT_BUTTON_SELECTOR = '#main-content > div > div.sc-dTGSLY.jZZrjP > aside > div.sc-cittYi.iEYiNU > div.search-option > i';
const NUMBER_INSERT_INPUT_SELECTOR = '#main-content > div > div.sc-dTGSLY.jZZrjP > aside > div.sc-jcVbNL.elVUfg > div.search-contacts-box > input[type=text]';
const NUMBER_CALL_BUTTON_SELECTOR = '#main-content > div > div.sc-dTGSLY.jZZrjP > aside > div.sc-jcVbNL.elVUfg > div.search-contacts-box > div > button > i';

const getAccessibleDocuments = () => {
  const docs = [];
  const addDocument = (doc) => {
    if (doc && !docs.includes(doc)) {
      docs.push(doc);
    }
  };

  const addWindowDocuments = (targetWindow) => {
    if (!targetWindow) return;

    try {
      addDocument(targetWindow.document);

      Array.from(targetWindow.frames || []).forEach((frame) => {
        try {
          addWindowDocuments(frame);
        } catch (error) {
          // Nested frame may be cross-origin.
        }
      });
    } catch (error) {
      // Window may be cross-origin when CRM is embedded.
    }
  };

  addWindowDocuments(window);
  addWindowDocuments(window.parent);
  addWindowDocuments(window.top);

  return docs;
};

const findByXPath = (doc, xpath) => {
  try {
    return doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  } catch (error) {
    return null;
  }
};

const findBySelector = (doc, selector) => {
  try {
    return doc.querySelector(selector);
  } catch (error) {
    return null;
  }
};

const findDialerElement = (doc, xpath, selector) => (
  findBySelector(doc, selector) || findByXPath(doc, xpath)
);

const findDialerInput = (doc) => (
  findBySelector(doc, PRIMARY_DIAL_INPUT_SELECTOR)
  || findByXPath(doc, PRIMARY_DIAL_INPUT_XPATH)
  || findDialerElement(doc, NUMBER_INSERT_INPUT_XPATH, NUMBER_INSERT_INPUT_SELECTOR)
);

const hasDialerControls = (doc) => (
  findBySelector(doc, PRIMARY_DIAL_INPUT_SELECTOR)
  || findByXPath(doc, PRIMARY_DIAL_INPUT_XPATH)
  || findDialerElement(doc, NUMBER_INSERT_BUTTON_XPATH, NUMBER_INSERT_BUTTON_SELECTOR)
  || findDialerElement(doc, NUMBER_INSERT_INPUT_XPATH, NUMBER_INSERT_INPUT_SELECTOR)
  || findDialerElement(doc, NUMBER_CALL_BUTTON_XPATH, NUMBER_CALL_BUTTON_SELECTOR)
);

const setInputValue = (input, value) => {
  const valueSetter = Object.getOwnPropertyDescriptor(input, 'value')?.set;
  const prototype = Object.getPrototypeOf(input);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(input, value);
  } else if (valueSetter) {
    valueSetter.call(input, value);
  } else {
    input.value = value;
  }

  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

const clickElement = (element) => {
  const clickable = element?.closest?.('button') || element;
  clickable?.click?.();
};

const pressEnter = (element) => {
  ['keydown', 'keypress', 'keyup'].forEach((eventType) => {
    element.dispatchEvent(new KeyboardEvent(eventType, {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13
    }));
  });
};

const postDialerMessage = (targetWindow, message, targetOrigin) => {
  try {
    targetWindow?.postMessage(message, targetOrigin);
  } catch (error) {
    console.warn('[CRM Dialer] Failed to post dialer message.', {
      targetOrigin,
      error: error?.message
    });
  }
};

const notifyHostDialer = (destination) => {
  const message = {
    type: 'CRM_DIAL_CUSTOMER',
    destination,
    xpaths: {
      primaryDialInput: PRIMARY_DIAL_INPUT_XPATH,
      numberInsertButton: NUMBER_INSERT_BUTTON_XPATH,
      numberInsertInput: NUMBER_INSERT_INPUT_XPATH,
      numberCallButton: NUMBER_CALL_BUTTON_XPATH
    },
    selectors: {
      primaryDialInput: PRIMARY_DIAL_INPUT_SELECTOR,
      numberInsertButton: NUMBER_INSERT_BUTTON_SELECTOR,
      numberInsertInput: NUMBER_INSERT_INPUT_SELECTOR,
      numberCallButton: NUMBER_CALL_BUTTON_SELECTOR
    }
  };

  postDialerMessage(window.parent, message, '*');
  postDialerMessage(window.top, message, '*');
};

const notifyEmbeddedUcp = (destination) => {
  if (typeof window.makeCall !== 'function') {
    return false;
  }

  try {
    return window.makeCall(destination) !== false;
  } catch (error) {
    console.warn('[CRM Dialer] Embedded UCP makeCall bridge failed.', {
      error: error?.message
    });
    return false;
  }
};

export const normalizeDialPhone = (value) => {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
};

export const dialCustomerPhone = (phoneNumber) => {
  const destination = normalizeDialPhone(phoneNumber);

  if (!destination) {
    alert('No phone number available for this record.');
    return false;
  }

  const dialerDocument = getAccessibleDocuments().find(hasDialerControls);

  if (!dialerDocument) {
    if (notifyEmbeddedUcp(destination)) {
      console.info('[CRM Dialer] Dialer DOM is not directly accessible. Sent request to embedded UCP.', { destination });
      return true;
    }

    console.info('[CRM Dialer] Dialer DOM is not directly accessible. Sending request to host page.', { destination });
    notifyHostDialer(destination);
    return true;
  }

  console.info('[CRM Dialer] Dialer DOM found. Filling number directly.', { destination });

  const primaryInput = findDialerInput(dialerDocument);

  if (primaryInput) {
    primaryInput.focus?.();
    setInputValue(primaryInput, destination);
    pressEnter(primaryInput);
    return true;
  }

  const insertButton = findDialerElement(dialerDocument, NUMBER_INSERT_BUTTON_XPATH, NUMBER_INSERT_BUTTON_SELECTOR);
  clickElement(insertButton);

  window.setTimeout(() => {
    const input = findDialerInput(dialerDocument);
    const callButton = findDialerElement(dialerDocument, NUMBER_CALL_BUTTON_XPATH, NUMBER_CALL_BUTTON_SELECTOR);

    if (!input) {
      console.warn('[CRM Dialer] Dialer input or call button not found after opening search box.', {
        inputFound: !!input,
        callButtonFound: !!callButton
      });
      alert('Dialer input was not found on this screen.');
      return;
    }

    input.focus?.();
    setInputValue(input, destination);

    if (callButton) {
      clickElement(callButton);
    } else {
      pressEnter(input);
    }
  }, 100);

  return true;
};
