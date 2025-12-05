<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <title>Afspraken Widget</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Reuse basic styles but override for widget -->
    <link rel="stylesheet" href="styles.css">
    
    <style>
        /* Widget specific overrides */
        body {
            background: transparent;
            padding: 0;
            margin: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            overflow: hidden; /* Prevent scrollbars on the iframe body */
        }
        .widget-container {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            height: 100vh; /* Fill iframe */
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
        }
        .widget-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 12px;
        }
        .widget-title {
            font-size: 16px;
            font-weight: 700;
            color: #2874A6;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .widget-list {
            list-style: none;
            padding: 0;
            margin: 0;
            flex: 1;
            overflow-y: auto;
        }
        .widget-item {
            padding: 10px 0;
            border-bottom: 1px solid #f5f5f5;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: background 0.2s;
        }
        .widget-item:hover {
            background: #f9f9f9;
            padding-left: 5px;
            padding-right: 5px;
            margin-left: -5px;
            margin-right: -5px;
            border-radius: 4px;
        }
        .widget-item:last-child {
            border-bottom: none;
        }
        .widget-icon {
            color: #2874A6;
            flex-shrink: 0;
        }
        .widget-content {
            flex: 1;
            min-width: 0; /* For text overflow */
        }
        .widget-item-title {
            font-weight: 600;
            color: #333;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: block;
        }
        .widget-item-meta {
            font-size: 11px;
            color: #888;
            margin-top: 2px;
            display: block;
        }
        .open-full-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            text-align: center;
            background: #2874A6;
            color: white;
            padding: 10px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            margin-top: 16px;
            transition: all 0.2s;
            border: none;
            cursor: pointer;
        }
        .open-full-btn:hover {
            background: #1A5276;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* Scrollbar styling for the list */
        .widget-list::-webkit-scrollbar {
            width: 6px;
        }
        .widget-list::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        .widget-list::-webkit-scrollbar-thumb {
            background: #ccc;
            border-radius: 3px;
        }
        .widget-list::-webkit-scrollbar-thumb:hover {
            background: #aaa;
        }
    </style>
    
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="PostCall.js"></script>
    <script src="widget.js"></script>
</head>
<body>
    <div class="widget-container">
        <div class="widget-header">
            <h3 class="widget-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Laatste Afspraken
            </h3>
        </div>
        
        <ul id="widgetList" class="widget-list">
            <li style="padding:20px; text-align:center; color:#888;">
                <div class="spinner" style="border-color:#2874A6; border-top-color:transparent;"></div>
                <div style="margin-top:10px; font-size:12px;">Laden...</div>
            </li>
        </ul>

        <a href="index.aspx" target="_blank" class="open-full-btn">
            <span>Volledig scherm openen</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
        </a>
    </div>
</body>
</html>