
// src/components/routes/Other/UCP/UCP.js

import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './UCP.css';

const UCP_LOGIN_URL = 'https://ucpmed.voicemeetme.com/ucp/login';
const UCP_POPUP_HEIGHT = 500;
const UCP_INCOMING_EXTENSION_CONTAINER_XPATH = '/html/body/div[2]/div/main/div/div[1]/div/div[3]/div[1]/div/div[3]/div';
const UCP_INCOMING_EXTENSION_XPATH = '/html/body/div[2]/div/main/div/div[1]/div/div[3]/div[1]/div/div[3]/div/div[2]/p';
const UCP_INCOMING_EXTENSION_CONTAINER_SELECTOR = '#main-content > div > div.sc-LUFyL.eterbs > div > div.embedded-main-content-container > div.sc-emTisi.hqWjHr > div > div.embedded-incoming-call-routing > div';
const UCP_INCOMING_EXTENSION_SELECTOR = '#main-content > div > div.sc-LUFyL.eterbs > div > div.embedded-main-content-container > div.sc-emTisi.hqWjHr > div > div.embedded-incoming-call-routing > div > div.embedded-incoming-call-routing-row-value > p';
const UCP_INCOMING_EXTENSION_LOOSE_SELECTOR = '.embedded-incoming-call-routing .embedded-incoming-call-routing-row-value p, [class*="embedded-incoming-call-routing"] [class*="embedded-incoming-call-routing-row-value"] p';
const UCP_INCOMING_ROUTING_MESSAGE_TYPE = 'UCP_INCOMING_ROUTING_VALUE';
const UCP_INCOMING_ROUTING_READ_REQUEST_TYPE = 'UCP_READ_INCOMING_ROUTING_VALUE';

const normalizeExtension = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim().replace(/\D/g, '');
};

const normalizeTeamName = (value) => (
  String(value || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
);

const extractExtensionFromText = (value) => {
  if (value === null || value === undefined) return '';

  const text = String(value).trim();
  if (!text) return '';

  const parenthesizedExtension = text.match(/\((\d{2,8})\)\s*$/);
  if (parenthesizedExtension?.[1]) {
    return parenthesizedExtension[1];
  }

  const trailingExtension = text.match(/(?:^|\D)(\d{2,8})\s*$/);
  if (trailingExtension?.[1]) {
    return trailingExtension[1];
  }

  return normalizeExtension(text);
};

const collectPayloadEntries = (value, path = '', entries = [], seen = new WeakSet()) => {
  if (value === null || value === undefined) return entries;

  if (typeof value === 'string' || typeof value === 'number') {
    entries.push({
      path: path.toLowerCase(),
      value: String(value)
    });
    return entries;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectPayloadEntries(item, `${path}.${index}`, entries, seen));
    return entries;
  }

  if (typeof value === 'object') {
    if (seen.has(value)) return entries;
    seen.add(value);

    const headerNames = ['To', 'to', 'P-Called-Party-ID', 'p-called-party-id', 'Diversion', 'diversion', 'Request-URI', 'request-uri'];

    headerNames.forEach((headerName) => {
      try {
        const headerValue = typeof value.getHeader === 'function' ? value.getHeader(headerName) : undefined;
        if (headerValue) collectPayloadEntries(headerValue, `${path}.getHeader.${headerName}`, entries, seen);
      } catch (error) {
        // Some SIP objects throw for missing headers.
      }

      try {
        const headerValue = typeof value.get === 'function' ? value.get(headerName) : undefined;
        if (headerValue) collectPayloadEntries(headerValue, `${path}.get.${headerName}`, entries, seen);
      } catch (error) {
        // Some header maps throw for missing keys.
      }
    });

    if (value instanceof Map) {
      value.forEach((item, key) => {
        collectPayloadEntries(item, path ? `${path}.${String(key)}` : String(key), entries, seen);
      });
      return entries;
    }

    const keys = Array.from(new Set([
      ...Object.keys(value),
      ...Object.getOwnPropertyNames(value)
    ])).filter((key) => !['parent', 'window', 'document', 'ownerDocument'].includes(key));

    keys.forEach((key) => {
      try {
        collectPayloadEntries(value[key], path ? `${path}.${key}` : key, entries, seen);
      } catch (error) {
        // Ignore getters that throw.
      }
    });
  }

  return entries;
};

const isIncomingPopupSignal = (data) => {
  if (!data) return false;
  if (typeof data === 'object' && data.type === UCP_INCOMING_ROUTING_READ_REQUEST_TYPE) return false;

  const haystack = collectPayloadEntries(data)
    .map((entry) => `${entry.path} ${entry.value}`)
    .join(' ')
    .toLowerCase();

  return haystack.includes('incomingcall')
    || haystack.includes('incoming call')
    || haystack.includes('emitincomingcall')
    || (haystack.includes('incoming') && haystack.includes('call'))
    || haystack.includes('record-route')
    || haystack.includes('call-id')
    || haystack.includes('sip:');
};

const findByXPath = (doc, xpath) => {
  try {
    return doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  } catch (error) {
    return null;
  }
};

const getReadableIframeDocument = (iframe) => {
  try {
    return iframe?.contentDocument || iframe?.contentWindow?.document || null;
  } catch (error) {
    return null;
  }
};

const addReadableWindowDocuments = (targetWindow, docs) => {
  if (!targetWindow) return;

  try {
    if (targetWindow.document && !docs.includes(targetWindow.document)) {
      docs.push(targetWindow.document);
    }

    Array.from(targetWindow.frames || []).forEach((frame) => {
      addReadableWindowDocuments(frame, docs);
    });
  } catch (error) {
    // Cross-origin window; browser will not allow DOM reads from this side.
  }
};

const getReadableUcpDocuments = (iframe) => {
  const docs = [];

  addReadableWindowDocuments(window, docs);
  addReadableWindowDocuments(window.parent, docs);
  addReadableWindowDocuments(window.top, docs);

  const iframeDocument = getReadableIframeDocument(iframe);
  if (iframeDocument && !docs.includes(iframeDocument)) {
    docs.push(iframeDocument);
  }

  return docs;
};

const postIncomingRoutingReadRequest = (iframe) => {
  const message = {
    type: UCP_INCOMING_ROUTING_READ_REQUEST_TYPE,
    replyType: UCP_INCOMING_ROUTING_MESSAGE_TYPE,
    containerXpath: UCP_INCOMING_EXTENSION_CONTAINER_XPATH,
    xpath: UCP_INCOMING_EXTENSION_XPATH,
    selector: UCP_INCOMING_EXTENSION_SELECTOR,
    containerSelector: '#main-content > div > div.sc-LUFyL.eterbs > div > div.embedded-main-content-container > div.sc-emTisi.hqWjHr > div > div.embedded-incoming-call-routing > div'
  };

  [iframe?.contentWindow, window.parent, window.top].forEach((targetWindow) => {
    if (!targetWindow || targetWindow === window) return;

    try {
      targetWindow.postMessage(message, '*');
    } catch (error) {
      // Cross-origin windows may still accept postMessage, but ignore failures.
    }
  });
};

const readIncomingRoutingValueFromUcpDocument = (doc) => {
  if (!doc) return { found: false, rawText: '', extension: '' };

  const container = findByXPath(doc, UCP_INCOMING_EXTENSION_CONTAINER_XPATH)
    || doc.querySelector(UCP_INCOMING_EXTENSION_CONTAINER_SELECTOR);
  const element = (container && (container.querySelector('.embedded-incoming-call-routing-row-value p') || container.querySelector('div:nth-child(2) p')))
    || findByXPath(doc, UCP_INCOMING_EXTENSION_XPATH)
    || doc.querySelector(UCP_INCOMING_EXTENSION_SELECTOR)
    || doc.querySelector(UCP_INCOMING_EXTENSION_LOOSE_SELECTOR);

  const rawText = String(element?.textContent || element?.innerText || '').trim();

  return {
    containerFound: Boolean(container),
    containerText: String(container?.textContent || container?.innerText || '').trim().slice(0, 200),
    found: Boolean(element),
    rawText,
    extension: extractExtensionFromText(rawText)
  };
};

const getIncomingRoutingValueMessage = (data) => {
  if (!data || typeof data !== 'object') return null;

  const type = String(data.type || data.event || data.name || '');
  if (type !== UCP_INCOMING_ROUTING_MESSAGE_TYPE) return null;

  const rawText = String(
    data.rawText
    || data.text
    || data.value
    || data.payload?.rawText
    || data.payload?.text
    || data.payload?.value
    || ''
  ).trim();

  if (!rawText) return null;

  return {
    found: true,
    rawText,
    extension: extractExtensionFromText(rawText)
  };
};

const isLikelyDestinationField = (path) => (
  /(^|\.)(to|callee|called|destination|dest|did|extension|queue|line|sip_to|request_uri|uri|target)$/i.test(path)
);

const isLikelyQueueNameField = (path) => (
  /(^|\.)(queue_name|queueName|queue\.name|queue)$/i.test(path)
);

const payloadValueMatchesExtension = (value, extension) => {
  if (!value || !extension) return false;

  const raw = String(value);
  const digits = normalizeExtension(raw);

  if (digits === extension) return true;

  return raw.includes(`sip:${extension}@`)
    || raw.includes(`<${extension}>`)
    || raw.includes(`:${extension}@`)
    || raw.includes(`/${extension}`)
    || new RegExp(`(^|[^0-9])${extension}([^0-9]|$)`).test(raw);
};

const getQueueNameRoutingValue = (data) => {
  const queueEntry = collectPayloadEntries(data)
    .find((entry) => isLikelyQueueNameField(entry.path));
  const rawText = String(queueEntry?.value || '').trim();

  if (!rawText) return null;

  return {
    found: true,
    rawText,
    extension: extractExtensionFromText(rawText),
    sourcePath: queueEntry.path
  };
};

const getTeamsFromResponse = (responseData) => {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.teams)) return responseData.teams;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.business?.teams)) return responseData.business.teams;
  return [];
};

const getTeamAssociates = (team) => {
  const associates = team?.associates || team?.members || team?.team_members || [];

  if (Array.isArray(associates)) return associates;

  if (typeof associates === 'string') {
    try {
      const parsedAssociates = JSON.parse(associates);
      return Array.isArray(parsedAssociates) ? parsedAssociates : [];
    } catch (error) {
      return [];
    }
  }

  return [];
};

const UCP = ({ isLoggedIn = true }) => { 
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const popupContainerRef = useRef(null);
  const iframeRef = useRef(null);
  const teamExtensionRoutesRef = useRef([]);
  const lastIncomingRouteRef = useRef({ extension: '', routedAt: 0 });
  const iframeAccessWarningShownRef = useRef(false);
  const lastIncomingRoutingValueRef = useRef('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleOpenPopup = useCallback(() => {
    // Position the container at bottom left with some padding
    const viewportHeight = window.innerHeight;
    const containerHeight = Math.min(UCP_POPUP_HEIGHT, viewportHeight - 40);
    const bottomPosition = Math.max(20, viewportHeight - containerHeight - 80); // 80px from bottom to be above the button

    setPosition({
      x: 20, // 20px from left edge
      y: bottomPosition
    });
    setShowPopup(true);
  }, []);

  const postMakeCallMessage = useCallback((destination) => {
    const iframe = iframeRef.current || document.getElementById('ucp-iframe');

    if (!iframe?.contentWindow || !destination) {
      return false;
    }

    iframe.contentWindow.postMessage({
      type: 'MAKE_CALL',
      payload: {
        destination
      }
    }, '*');

    return true;
  }, []);

  const makeCall = useCallback((destination) => {
    if (!destination) {
      return false;
    }

    if (!showPopup) {
      handleOpenPopup();
    }

    window.setTimeout(() => {
      postMakeCallMessage(destination);
    }, 0);

    return true;
  }, [handleOpenPopup, postMakeCallMessage, showPopup]);

  const getStoredUserData = useCallback(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    let tokenData = {};

    if (token) {
      try {
        tokenData = JSON.parse(atob(token.split('.')[1]));
      } catch (error) {
        console.warn('[UCP] Failed to decode auth token for incoming-call routing.', error);
      }
    }

    return {
      token,
      userData: {
        ...tokenData,
        ...storedUser
      }
    };
  }, []);

  const buildTeamExtensionRoutes = useCallback((teams, fallbackBusinessId) => (
    (Array.isArray(teams) ? teams : [])
      .flatMap((team) => {
        const businessId = team.business_id
          || team.businessId
          || team.business_center_id
          || fallbackBusinessId;

        if (!businessId || !team.team_name) return [];

        const path = `/dashboard/business/${businessId}/team/${encodeURIComponent(team.team_name)}`;
        const routes = [];
        const teamExtension = normalizeExtension(team.team_extension);

        if (teamExtension) {
          routes.push({
            extension: teamExtension,
            extensionType: 'team',
            teamName: team.team_name,
            path
          });
        }

        getTeamAssociates(team).forEach((associate) => {
          const associateExtension = normalizeExtension(associate.extension);
          if (!associateExtension) return;

          routes.push({
            extension: associateExtension,
            extensionType: 'associate',
            associateName: associate.username || associate.name || associate.email || '',
            associateId: associate.id,
            teamName: team.team_name,
            path
          });
        });

        return routes;
      })
      .filter(Boolean)
      .filter((route, index, routes) => (
        routes.findIndex((candidate) => candidate.extension === route.extension) === index
      ))
  ), []);

  const fetchTeamMembersForRoutes = useCallback(async (routes, teams, businessId, headers) => {
    const routesByExtension = new Map(routes.map((route) => [route.extension, route]));

    await Promise.all((Array.isArray(teams) ? teams : []).map(async (team) => {
      if (!team?.id || !team?.team_name) return;

      const teamBusinessId = team.business_id
        || team.businessId
        || team.business_center_id
        || businessId;

      if (!teamBusinessId) return;

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/business/${teamBusinessId}/team/${team.id}/members`,
          { headers }
        );

        getTeamsFromResponse(response.data).forEach((member) => {
          const extension = normalizeExtension(member.extension);
          if (!extension || routesByExtension.has(extension)) return;

          routesByExtension.set(extension, {
            extension,
            extensionType: 'associate',
            associateName: member.username || member.name || member.email || '',
            associateId: member.id,
            teamName: team.team_name,
            path: `/dashboard/business/${teamBusinessId}/team/${encodeURIComponent(team.team_name)}`
          });
        });
      } catch (error) {
        console.error('[UCP] Failed to fetch team members for incoming-call routing.', {
          teamId: team.id,
          teamName: team.team_name,
          error: error?.response?.data || error?.message
        });
      }
    }));

    return Array.from(routesByExtension.values());
  }, []);

  const fetchTeamExtensionRoutes = useCallback(async () => {
    const { token, userData } = getStoredUserData();
    if (!token) return [];

    const businessId = userData.business_center_id || userData.business_id || localStorage.getItem('businessId');
    if (!businessId) return [];

    const headers = { Authorization: `Bearer ${token}` };
    const endpoints = [
      `${process.env.REACT_APP_API_URL}/business/${businessId}/teams`,
      `${process.env.REACT_APP_API_URL}/business-center/${businessId}/teams`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint, { headers });
        const teams = getTeamsFromResponse(response.data);
        const initialRoutes = buildTeamExtensionRoutes(teams, businessId);
        const routes = await fetchTeamMembersForRoutes(initialRoutes, teams, businessId, headers);

        if (routes.length > 0) {
          console.info('[UCP] Loaded incoming-call team routes.', {
            endpoint,
            routes
          });
          teamExtensionRoutesRef.current = routes;
          return routes;
        }

        console.info('[UCP] Team endpoint returned no extension routes.', {
          endpoint,
          response: response.data
        });
      } catch (error) {
        console.error('[UCP] Failed to fetch teams for incoming-call routing.', {
          endpoint,
          error: error?.response?.data || error?.message
        });
      }
    }

    return teamExtensionRoutesRef.current;
  }, [buildTeamExtensionRoutes, fetchTeamMembersForRoutes, getStoredUserData]);

  const findIncomingTeamRoute = useCallback((data, routes, options = {}) => {
    const {
      allowFallbackEntries = true,
      teamOnly = false
    } = options;
    const candidateRoutes = teamOnly
      ? routes.filter((route) => route.extensionType === 'team')
      : routes;
    const entries = collectPayloadEntries(data);
    const destinationEntries = entries.filter((entry) => (
      isLikelyDestinationField(entry.path)
      || entry.path.includes('headers.to')
      || entry.path.endsWith('.to.0')
      || entry.path.includes('request_uri')
      || entry.path.includes('ruri')
    ));
    const queueNameEntries = entries.filter((entry) => isLikelyQueueNameField(entry.path));
    const fallbackEntries = entries.filter((entry) => !isLikelyDestinationField(entry.path));

    return candidateRoutes.find((route) => (
      queueNameEntries.some((entry) => normalizeTeamName(entry.value) === normalizeTeamName(route.teamName))
      || destinationEntries.some((entry) => payloadValueMatchesExtension(entry.value, route.extension))
      || (
        allowFallbackEntries
        && fallbackEntries.some((entry) => payloadValueMatchesExtension(entry.value, route.extension))
      )
    ));
  }, []);

  const routeIncomingExtensionToTeam = useCallback(async (extension, source = 'unknown', options = {}) => {
    const normalizedExtension = normalizeExtension(extension);
    if (!normalizedExtension) return false;

    let routes = teamExtensionRoutesRef.current;

    if (routes.length === 0) {
      routes = await fetchTeamExtensionRoutes();
    }

    const candidateRoutes = options.teamOnly
      ? routes.filter((route) => route.extensionType === 'team')
      : routes;
    const matchedRoute = candidateRoutes.find((route) => route.extension === normalizedExtension);
    if (!matchedRoute) return false;

    const now = Date.now();
    if (
      lastIncomingRouteRef.current.extension === matchedRoute.extension
      && now - lastIncomingRouteRef.current.routedAt < 5000
    ) {
      return true;
    }

    lastIncomingRouteRef.current = {
      extension: matchedRoute.extension,
      routedAt: now
    };

    console.info('[UCP] Routing incoming call to team page.', {
      extension: matchedRoute.extension,
      teamName: matchedRoute.teamName,
      path: matchedRoute.path,
      source
    });

    navigate(matchedRoute.path);
    return true;
  }, [fetchTeamExtensionRoutes, navigate]);

  const routeIncomingRoutingValueToTeam = useCallback(async ({ rawText, extension }, source = 'ucp-dom') => {
    const normalizedExtension = normalizeExtension(extension || rawText);
    const normalizedName = normalizeTeamName(rawText);
    if (!normalizedExtension && !normalizedName) return false;

    let routes = teamExtensionRoutesRef.current;

    if (routes.length === 0) {
      routes = await fetchTeamExtensionRoutes();
    }

    const teamRoutes = routes.filter((route) => route.extensionType === 'team');
    const matchedRoute = teamRoutes.find((route) => (
      (normalizedExtension && route.extension === normalizedExtension)
      || (normalizedName && normalizeTeamName(route.teamName) === normalizedName)
    ));

    if (!matchedRoute) return false;

    const now = Date.now();
    if (
      lastIncomingRouteRef.current.extension === matchedRoute.extension
      && now - lastIncomingRouteRef.current.routedAt < 5000
    ) {
      return true;
    }

    lastIncomingRouteRef.current = {
      extension: matchedRoute.extension,
      routedAt: now
    };

    console.info('[UCP] Routing incoming call from XPath value.', {
      rawText,
      extension: matchedRoute.extension,
      teamName: matchedRoute.teamName,
      path: matchedRoute.path,
      source
    });

    navigate(matchedRoute.path);
    return true;
  }, [fetchTeamExtensionRoutes, navigate]);

  const routeIncomingCallToTeam = useCallback(async (data, options = {}) => {
    let routes = teamExtensionRoutesRef.current;

    if (routes.length === 0) {
      routes = await fetchTeamExtensionRoutes();
    }

    const matchedRoute = findIncomingTeamRoute(data, routes, options);
    if (!matchedRoute) {
      const payloadEntries = collectPayloadEntries(data);
      const destinationEntries = payloadEntries.filter((entry) => (
        isLikelyDestinationField(entry.path)
        || entry.path.includes('headers.to')
        || entry.path.endsWith('.to.0')
        || entry.path.includes('request_uri')
        || entry.path.includes('ruri')
      ));
      const queueNameEntries = payloadEntries.filter((entry) => isLikelyQueueNameField(entry.path));
      const noMatchLog = {
        knownExtensions: routes
          .filter((route) => !options.teamOnly || route.extensionType === 'team')
          .map((route) => route.extension),
        knownTeamNames: routes
          .filter((route) => !options.teamOnly || route.extensionType === 'team')
          .map((route) => route.teamName),
        queueNameEntries: queueNameEntries.slice(0, 20),
        destinationEntries: destinationEntries.slice(0, 50),
        data
      };

      console.info('[UCP] Incoming/SIP payload did not match any team extension.', {
        ...noMatchLog
      });
      console.info('[UCP] Incoming/SIP no-match json:', JSON.stringify({
        knownExtensions: noMatchLog.knownExtensions,
        knownTeamNames: noMatchLog.knownTeamNames,
        queueNameEntries: noMatchLog.queueNameEntries,
        destinationEntries: noMatchLog.destinationEntries
      }));
      return false;
    }

    return routeIncomingExtensionToTeam(matchedRoute.extension, options.source || 'message');
  }, [fetchTeamExtensionRoutes, findIncomingTeamRoute, routeIncomingExtensionToTeam]);

  const handleMinimize = () => {
    setShowPopup(false); // Hide the popup when minimized
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.ucp-popup-header') && !e.target.closest('button')) {
      setIsDragging(true);
      const rect = popupContainerRef.current.getBoundingClientRect();
      setStartPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && popupContainerRef.current) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const containerWidth = popupContainerRef.current.offsetWidth;
      const containerHeight = popupContainerRef.current.offsetHeight;

      let x = e.clientX - startPos.x;
      let y = e.clientY - startPos.y;

      // Ensure the container stays within viewport bounds
      if (x < 0) x = 0;
      if (y < 0) y = 0;
      if (x + containerWidth > viewportWidth) x = viewportWidth - containerWidth;
      if (y + containerHeight > viewportHeight) y = viewportHeight - containerHeight;

      setPosition({ x, y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startPos]);

  useEffect(() => {
    window.makeCall = makeCall;
    window.openUcpPopup = handleOpenPopup;
    window.routeIncomingUcpCall = routeIncomingCallToTeam;
    window.routeIncomingUcpExtension = routeIncomingExtensionToTeam;

    return () => {
      if (window.makeCall === makeCall) {
        delete window.makeCall;
      }
      if (window.openUcpPopup === handleOpenPopup) {
        delete window.openUcpPopup;
      }
      if (window.routeIncomingUcpCall === routeIncomingCallToTeam) {
        delete window.routeIncomingUcpCall;
      }
      if (window.routeIncomingUcpExtension === routeIncomingExtensionToTeam) {
        delete window.routeIncomingUcpExtension;
      }
    };
  }, [handleOpenPopup, makeCall, routeIncomingCallToTeam, routeIncomingExtensionToTeam]);

  useEffect(() => {
    if (!isLoggedIn) return;

    fetchTeamExtensionRoutes();
  }, [fetchTeamExtensionRoutes, isLoggedIn]);

  const scanIncomingRoutingValue = useCallback(async (source = 'ucp-dom', options = {}) => {
    try {
      const iframe = iframeRef.current || document.getElementById('ucp-iframe');
      postIncomingRoutingReadRequest(iframe);

      const readableDocuments = getReadableUcpDocuments(iframe);

      if (readableDocuments.length === 0) {
        console.info('[UCP] Incoming routing XPath check.', {
          source,
          reason: 'no-readable-documents',
          containerXpath: UCP_INCOMING_EXTENSION_CONTAINER_XPATH,
          containerSelector: UCP_INCOMING_EXTENSION_CONTAINER_SELECTOR,
          xpath: UCP_INCOMING_EXTENSION_XPATH,
          selector: UCP_INCOMING_EXTENSION_SELECTOR
        });
        return false;
      }

      const routingValueChecks = readableDocuments
        .map((doc, index) => ({
          documentIndex: index,
          title: doc.title || '',
          url: doc.location?.href || '',
          ...readIncomingRoutingValueFromUcpDocument(doc)
        }));
      const routingValue = routingValueChecks
        .find((value) => value.rawText)
        || {
          documentIndex: -1,
          ...readIncomingRoutingValueFromUcpDocument(readableDocuments[0])
        };
      const routingValueKey = JSON.stringify(routingValue);

      if (options.forceLog || lastIncomingRoutingValueRef.current !== routingValueKey) {
        lastIncomingRoutingValueRef.current = routingValueKey;
        const scanLog = {
          source,
          readableDocumentCount: readableDocuments.length,
          containerXpath: UCP_INCOMING_EXTENSION_CONTAINER_XPATH,
          containerSelector: UCP_INCOMING_EXTENSION_CONTAINER_SELECTOR,
          xpath: UCP_INCOMING_EXTENSION_XPATH,
          selector: UCP_INCOMING_EXTENSION_SELECTOR,
          checks: routingValueChecks.map((check) => ({
            documentIndex: check.documentIndex,
            title: check.title,
            url: check.url,
            containerFound: check.containerFound,
            found: check.found,
            rawText: check.rawText,
            extension: check.extension,
            containerText: check.containerText
          })),
          ...routingValue
        };

        console.info('[UCP] Incoming routing XPath check.', scanLog);
        console.info('[UCP] Incoming routing XPath check json:', JSON.stringify(scanLog));
      }

      if (!routingValue.rawText) return false;

      const routed = await routeIncomingRoutingValueToTeam(routingValue, source);
      if (routed) {
        handleOpenPopup();
      }

      return routed;
    } catch (error) {
      console.error('[UCP] Incoming routing XPath poll failed.', {
        source,
        error: error?.message || error
      });
      return false;
    }
  }, [handleOpenPopup, routeIncomingRoutingValueToTeam]);

  useEffect(() => {
    if (!isLoggedIn) return undefined;

    const pollIncomingExtensionFromUcp = async () => {
      await scanIncomingRoutingValue('ucp-dom');
    };

    const intervalId = window.setInterval(pollIncomingExtensionFromUcp, 700);
    pollIncomingExtensionFromUcp();

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isLoggedIn, scanIncomingRoutingValue]);

  useEffect(() => {
    if (!isLoggedIn) return undefined;

    const handleIncomingPopupMessage = async (event) => {
      const routingValue = getIncomingRoutingValueMessage(event.data);

      if (routingValue) {
        console.info('[UCP] Incoming routing XPath value received from UCP bridge.', {
          xpath: UCP_INCOMING_EXTENSION_XPATH,
          selector: UCP_INCOMING_EXTENSION_SELECTOR,
          ...routingValue
        });

        const routed = await routeIncomingRoutingValueToTeam(routingValue, 'ucp-xpath-bridge');
        if (routed) {
          handleOpenPopup();
        }

        return;
      }

      const queueNameRoutingValue = getQueueNameRoutingValue(event.data);
      if (queueNameRoutingValue) {
        console.info('[UCP] Incoming queue_name received for team routing.', queueNameRoutingValue);

        const routed = await routeIncomingRoutingValueToTeam(queueNameRoutingValue, 'queue-name');
        if (routed) {
          handleOpenPopup();
        }

        return;
      }

      if (!isIncomingPopupSignal(event.data)) return;

      console.info('[UCP] Incoming call signal received. Opening popup; routing from XPath bridge or strict SIP destination only.', {
        data: event.data
      });
      handleOpenPopup();

      [0, 300, 900, 1800, 3000].forEach((delayMs) => {
        window.setTimeout(() => {
          scanIncomingRoutingValue('incoming-signal-xpath-scan', { forceLog: true });
        }, delayMs);
      });

      await routeIncomingCallToTeam(event.data, {
        teamOnly: true,
        allowFallbackEntries: false,
        source: 'sip-destination'
      });
    };

    window.addEventListener('message', handleIncomingPopupMessage);

    return () => {
      window.removeEventListener('message', handleIncomingPopupMessage);
    };
  }, [handleOpenPopup, isLoggedIn, routeIncomingCallToTeam, routeIncomingRoutingValueToTeam, scanIncomingRoutingValue]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <button 
        className="ucp-popup-btn" 
        onClick={handleOpenPopup}
      >
        Open UCP
      </button>

      <div 
        className={`ucp-popup-container ${!showPopup ? 'ucp-hidden' : ''}`}
        ref={popupContainerRef}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          position: 'fixed',
          top: 0,
          left: 0
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="ucp-popup-header">
          <button 
            className="ucp-minimize-btn" 
            onClick={handleMinimize}
            title="Minimize"
          >
            -
          </button>
        </div>
        <iframe 
          id="ucp-iframe"
          ref={iframeRef}
          src={UCP_LOGIN_URL} 
          title="ucp"
          className="ucp-iframe"
          allow="notifications; microphone"
          style={{ display: showPopup ? 'block' : 'none' }}
        />
      </div>
    </>
  );
};

export default UCP;
