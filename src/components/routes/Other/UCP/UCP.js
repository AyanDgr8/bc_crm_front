// src/components/routes/Other/UCP/UCP.js

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './UCP.css';

const UCP_LOGIN_URL = 'https://ucpmed.voicemeetme.com/ucp/login';

const UCP = ({ isLoggedIn = true }) => { 
  const [showPopup, setShowPopup] = useState(false);
  const popupContainerRef = useRef(null);
  const iframeRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleOpenPopup = useCallback(() => {
    // Position the container at bottom left with some padding
    const viewportHeight = window.innerHeight;
    const containerHeight = 400; // Same as defined in CSS
    const bottomPosition = viewportHeight - containerHeight - 80; // 80px from bottom to be above the button

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

    return () => {
      if (window.makeCall === makeCall) {
        delete window.makeCall;
      }
    };
  }, [makeCall]);

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
