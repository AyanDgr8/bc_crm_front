// src/components/routes/Other/Header/Download/DownloadData.js

import React from "react";
import { useNavigate } from "react-router-dom";

const DownloadData = () => {
    const navigate = useNavigate();

    const handleDownloadClick = () => {
        navigate('/download');
    };

    return (
        <div className="download-section">
            <img 
                src="/uploads/download.svg"
                className="download-icon"
                alt="download data icon"
                aria-label="Download data"
                onClick={handleDownloadClick}
                style={{ cursor: 'pointer' }}
            />
            <span className="download-text" onClick={handleDownloadClick} style={{ cursor: 'pointer' }}>Download</span>
        </div>
    );
};

export default DownloadData;