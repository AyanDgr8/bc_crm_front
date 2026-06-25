// src/components/routes/Other/UCP/UCP.js

import React, { useState, useRef, useEffect } from 'react';
import {useNavigate} from 'react-router-dom';
import './UCP.css';

const UCP = ({ isLoggedIn = true }) => { 
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const popupContainerRef = useRef(null);
  const iframeRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const ucpUrl = 'https://ucpmed.voicemeetme.com/ucp/login';

  const handleOpenPopup = () => {
    setShowPopup(true);
  };

  const handleMinimize = () => {
    setShowPopup(false);
  };

  const handleMouseDown = (e) => {
    if (e.target.tagName !== 'IFRAME' && e.target.tagName !== 'BUTTON') {
      setIsDragging(true);
      setStartPos({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handler for UCP incoming calls
  const handleUCPMessage = (event) => {
    // Verify origin for security
    if (event.origin !== new URL(ucpUrl).origin) {
      console.warn('Received message from unauthorized origin:', event.origin);
      return;
    }

    try {
      // Handle different message types
      switch (event.data.type) {
        case 'UCP_INCOMING_CALL':
          console.info('Incoming call from ======= :', event.data.payload.queue_name);
          // Show the UCP window if minimized
          setShowPopup(true);
          // Bring window to front
          if (popupContainerRef.current) {
            popupContainerRef.current.style.zIndex = '9999';
          }
          navigate(`/team/${event.data.payload.queue_name}`);
          break;

        case 'UCP_SESSION_CREATED':
          console.info('UCP session created:', event.data.sessionId);
          break;

        case 'UCP_FULLSCREEN_CHANGE':
          if (event.data.isFullscreen && popupContainerRef.current) {
            popupContainerRef.current.style.width = '100%';
            popupContainerRef.current.style.height = '100%';
            popupContainerRef.current.style.transform = 'none';
            setPosition({ x: 0, y: 0 });
          }
          break;

        default:
          console.info('Received UCP message:', event.data);
      }
    } catch (error) {
      console.error('Error handling UCP message:', error);
    }
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('message', handleUCPMessage, false);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('message', handleUCPMessage, false);
    };
  }, [isDragging, startPos]);

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
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
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
          ref={iframeRef}
          src={ucpUrl}
          title="UCP Embedded"
          className="ucp-iframe"
          allow="microphone; camera; autoplay"
          style={{ display: showPopup ? 'block' : 'none' }}
        />
      </div>
    </>
  );
};

export default UCP;
