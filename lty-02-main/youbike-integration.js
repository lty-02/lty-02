/**
 * YouBike TDX API 地圖連動整合功能
 * 為台中市烏日區智慧 YouBike 選址系統增加即時資料顯示
 */

// 全局變數
let allYouBikeStations = [];  // 存儲所有車站數據
let stationInfoCache = {};    // 存儲站點靜態資訊
let youbikeAnalysisVars = {   // 分析變數
  activeAnalysisLayer: null,
  serviceRadius: 300,         // 預設服務半徑 (公尺)
  lastQueryGeometry: null     // 最後使用的查詢幾何
};

// TDX API 整合初始化函數
function initTDXIntegration() {
  // 添加 YouBike 即時資料標籤頁
  addYouBikeTab();
  
  // 載入 YouBike 樣式
  addYouBikeStyles();
  
  // 載入即時資料
  loadYouBikeData();
  
  // 添加 YouBike 分析功能到查詢面板
  setTimeout(() => {
    addYouBikeAnalysisToQueryPanel();
  }, 2000);
  
  // 每分鐘更新一次資料
  setInterval(loadYouBikeData, 60000);
}

// 添加 YouBike 樣式
function addYouBikeStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* YouBike 地圖整合樣式 */
    .youbike-layer-toggle {
      margin-top: 15px;
      padding: 10px;
      background-color: #f8f9fa;
      border-radius: 6px;
    }
    
    .switch {
      position: relative;
      display: inline-block;
      width: 40px;
      height: 20px;
    }
    
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
    }
    
    .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: .4s;
    }
    
    input:checked + .slider {
      background-color: #e6a61e;
    }
    
    input:checked + .slider:before {
      transform: translateX(20px);
    }
    
    .slider.round {
      border-radius: 34px;
    }
    
    .slider.round:before {
      border-radius: 50%;
    }
    
    .youbike-legend {
      margin-top: 10px;
      font-size: 12px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      margin-bottom: 5px;
    }
    
    .legend-color {
      width: 12px;
      height: 12px;
      display: inline-block;
      margin-right: 8px;
      border-radius: 50%;
    }
    
    #youbikeStationList .analysis-item:hover {
      background-color: #f5f5f5;
      cursor: pointer;
    }
    
    .nearest-stations .analysis-item {
      border-left: 3px solid #e6a61e;
      transition: all 0.2s ease;
    }
    
    .nearest-stations .analysis-item:hover {
      transform: translateX(5px);
      background-color: #f8f9fa;
    }
    
    #youbikeQuerySection {
      margin-top: 20px;
      border-top: 1px solid #ccc;
      padding-top: 15px;
    }
    
    #youbikeAnalysisResults h4 {
      margin-top: 0;
      margin-bottom: 15px;
      color: #333;
      font-size: 16px;
      border-bottom: 1px solid #eee;
      padding-bottom: 8px;
    }
    
    .youbike-analysis-button {
      width: 100%;
      padding: 10px;
      background-color: #e6a61e !important;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      margin-top: 8px;
    }
    
    .youbike-analysis-button:hover {
      background-color: #d4941b !important;
    }
    
    .opportunity-indicator {
      margin-top: 15px;
      padding: 10px;
      border-radius: 5px;
      text-align: center;
      font-weight: bold;
      color: white;
    }
    
    .opportunity-high {
      background-color: #28a745;
    }
    
    .opportunity-medium {
      background-color: #ffc107;
      color: #333;
    }
    
    .opportunity-low {
      background-color: #dc3545;
    }
    
    .loading-message, .error-message, .no-data {
      padding: 20px;
      text-align: center;
      color: #666;
    }
    
    .error-message {
      color: #dc3545;
    }
  `;
  document.head.appendChild(style);
}

// 添加 YouBike 即時資料標籤頁
function addYouBikeTab() {
  // 添加標籤按鈕
  const tabContainer = document.getElementById('tabContainer');
  if (!tabContainer) return;
  
  const youbikeButton = document.createElement('button');
  youbikeButton.className = 'tabButton';
  youbikeButton.textContent = '車位查詢';
  tabContainer.appendChild(youbikeButton);
  
  // 添加標籤內容
  const widgetsContainer = document.getElementById('widgets-container');
  if (!widgetsContainer) return;
  
  const youbikeTab = document.createElement('div');
  youbikeTab.id = 'youbike-tab';
  youbikeTab.className = 'tabContent';
  youbikeTab.style.display = 'none';
  
  youbikeTab.innerHTML = `
    <div class="widget-container">
      <h3 style="text-align: center; margin-bottom: 15px;">YouBike 即時車位資訊</h3>
      <div class="youbike-controls">
        <input type="text" id="youbikeSearch" class="form-control" placeholder="搜尋站點..." style="margin-bottom: 10px; width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <select id="youbikeSort" class="district-dropdown" style="width: 48%;">
            <option value="name">依站名排序</option>
            <option value="availableBikes">依可借車數排序</option>
            <option value="availableSpaces">依可還空位排序</option>
          </select>
          <button id="refreshYouBike" class="sort-button" style="width: 48%;">
            <span>🔄 更新資料</span>
          </button>
        </div>
      </div>
      <div id="youbikeStationList" style="max-height: 400px; overflow-y: auto; margin-top: 10px;">
        <div class="loading-message">載入中...</div>
      </div>
      <div id="youbikeLastUpdate" style="text-align: right; font-size: 12px; color: #666; margin-top: 10px;"></div>
    </div>
  `;
  
  widgetsContainer.appendChild(youbikeTab);
  
  // 添加點擊事件
  youbikeButton.addEventListener('click', function() {
    // 隱藏所有標籤內容
    const tabContents = document.querySelectorAll('.tabContent');
    tabContents.forEach(tab => tab.style.display = 'none');
    
    // 顯示YouBike標籤內容
    youbikeTab.style.display = 'block';
    
    // 移除所有按鈕active狀態
    const buttons = document.querySelectorAll('.tabButton');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // 添加active狀態到當前按鈕
    youbikeButton.classList.add('active');
  });
  
  // 添加搜尋和排序事件
  document.getElementById('youbikeSearch').addEventListener('input', filterYouBikeStations);
  document.getElementById('youbikeSort').addEventListener('change', sortYouBikeStations);
  document.getElementById('refreshYouBike').addEventListener('click', loadYouBikeData);
}

// 載入 YouBike 資料
function loadYouBikeData() {
  const stationList = document.getElementById('youbikeStationList');
  if (!stationList) return;
  
  stationList.innerHTML = '<div class="loading-message">載入中...</div>';
  
  // 如果沒有站點靜態資訊，先獲取靜態資訊
  const fetchStationInfo = Object.keys(stationInfoCache).length > 0 ? 
    Promise.resolve(stationInfoCache) : 
    fetchYouBikeStationInfo();
  
  // 首先獲取靜態資訊，然後獲取即時資訊
  fetchStationInfo
    .then(() => {
      // 獲取即時資訊
      return fetch('https://tdx.transportdata.tw/api/basic/v2/Bike/Availability/City/Taichung?$format=JSON', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJER2lKNFE5bFg4WldFajlNNEE2amFVNm9JOGJVQ3RYWGV6OFdZVzh3ZkhrIn0.eyJleHAiOjE3NDMzMjMyNzEsImlhdCI6MTc0MzIzNjg3MSwianRpIjoiZWEwYzBmOGUtMmZlNy00ZjU2LTk5Y2MtN2E5ZWE3OWI5MjE1IiwiaXNzIjoiaHR0cHM6Ly90ZHgudHJhbnNwb3J0ZGF0YS50dy9hdXRoL3JlYWxtcy9URFhDb25uZWN0Iiwic3ViIjoiY2YwYmIyZGItZmUzZC00NTZkLThkOWEtNTUyNTNmOTE3NzA5IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiZjY0MTA5NTM1LWQ4NTIxMTYxLTRjZmEtNGRlNSIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsic3RhdGlzdGljIiwicHJlbWl1bSIsInBhcmtpbmdGZWUiLCJtYWFzIiwiYWR2YW5jZWQiLCJnZW9pbmZvIiwidmFsaWRhdG9yIiwidG91cmlzbSIsImhpc3RvcmljYWwiLCJjd2EiLCJiYXNpYyJdfSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwidXNlciI6IjJkMmJmMDU5In0.XQdD4o_Qp84UhhhJnaLx2C61jZDN2s1DjKsxnhKReYeTfKFIOLvpO-4yG3Khiqjtnfmvy-8hpf2HR-CHOegWHBpu0QfkWA3MgbIQmhXDAyBzeUozqUMRjp_qIiMmkwQNM2e2CQGR48JPkv_richg7yY2qQQASd55QLIof4AkDrY6JQrtEXNNnP6hGumUhonlFAPUpTe3XoBvyh2JsCOcBPP3aLfma882jR6kamG5YnWEIN0PAx6zt2c24U7Y_G0vabJMemvz9qOQ34Ebo5m2qKMArw1yABT9b1RVpfA-N2wUR-EbZUY08Tuz8rMDN16pr_rprVQccjeNuXANcooDWQ'
        }
      });
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('API 請求失敗: ' + response.status);
      }
      return response.json();
    })
    .then(availabilityData => {
      // 合併靜態資訊和即時資訊
      const mergedData = availabilityData.map(station => {
        const stationInfo = stationInfoCache[station.StationUID] || {
          StationName: { Zh_tw: `站點 ${station.StationID}` }, // 預設值
          StationPosition: { PositionLon: 0, PositionLat: 0 },
          StationAddress: { Zh_tw: '資訊載入中' }
        };
        
        return {
          ...station,
          ...stationInfo
        };
      });
      
      allYouBikeStations = mergedData;
      
      // 過濾烏日區的站點（假設站名包含「烏日」或者地址包含「烏日」）
      const wuriStations = allYouBikeStations.filter(station => {
        const stationName = station.StationName?.Zh_tw || '';
        const stationAddress = station.StationAddress?.Zh_tw || '';
        return stationName.includes('烏日') || stationAddress.includes('烏日');
      });
      
      const stationsToShow = wuriStations.length > 0 ? wuriStations : allYouBikeStations;
      
      // 渲染列表
      renderStationList(stationsToShow);
      
      // 在地圖上顯示所有站點
      showAllStationsOnMap(stationsToShow);
      
      // 更新資料時間
      const now = new Date();
      const lastUpdateElement = document.getElementById('youbikeLastUpdate');
      if (lastUpdateElement) {
        lastUpdateElement.textContent = `最後更新時間: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
      }
    })
    .catch(error => {
      console.error('獲取YouBike資料時出錯:', error);
      if (stationList) {
        stationList.innerHTML = `<div class="error-message">載入失敗: ${error.message}</div>`;
      }
    });
}

// 獲取 YouBike 站點靜態資訊
function fetchYouBikeStationInfo() {
  return fetch('https://tdx.transportdata.tw/api/basic/v2/Bike/Station/City/Taichung?$format=JSON', {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJER2lKNFE5bFg4WldFajlNNEE2amFVNm9JOGJVQ3RYWGV6OFdZVzh3ZkhrIn0.eyJleHAiOjE3NDMzMjMyNzEsImlhdCI6MTc0MzIzNjg3MSwianRpIjoiZWEwYzBmOGUtMmZlNy00ZjU2LTk5Y2MtN2E5ZWE3OWI5MjE1IiwiaXNzIjoiaHR0cHM6Ly90ZHgudHJhbnNwb3J0ZGF0YS50dy9hdXRoL3JlYWxtcy9URFhDb25uZWN0Iiwic3ViIjoiY2YwYmIyZGItZmUzZC00NTZkLThkOWEtNTUyNTNmOTE3NzA5IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiZjY0MTA5NTM1LWQ4NTIxMTYxLTRjZmEtNGRlNSIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsic3RhdGlzdGljIiwicHJlbWl1bSIsInBhcmtpbmdGZWUiLCJtYWFzIiwiYWR2YW5jZWQiLCJnZW9pbmZvIiwidmFsaWRhdG9yIiwidG91cmlzbSIsImhpc3RvcmljYWwiLCJjd2EiLCJiYXNpYyJdfSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwidXNlciI6IjJkMmJmMDU5In0.XQdD4o_Qp84UhhhJnaLx2C61jZDN2s1DjKsxnhKReYeTfKFIOLvpO-4yG3Khiqjtnfmvy-8hpf2HR-CHOegWHBpu0QfkWA3MgbIQmhXDAyBzeUozqUMRjp_qIiMmkwQNM2e2CQGR48JPkv_richg7yY2qQQASd55QLIof4AkDrY6JQrtEXNNnP6hGumUhonlFAPUpTe3XoBvyh2JsCOcBPP3aLfma882jR6kamG5YnWEIN0PAx6zt2c24U7Y_G0vabJMemvz9qOQ34Ebo5m2qKMArw1yABT9b1RVpfA-N2wUR-EbZUY08Tuz8rMDN16pr_rprVQccjeNuXANcooDWQ'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('站點資訊 API 請求失敗: ' + response.status);
    }
    return response.json();
  })
  .then(data => {
    // 將站點資訊轉換為以 StationUID 為鍵的對象
    stationInfoCache = {};
    data.forEach(info => {
      stationInfoCache[info.StationUID] = {
        StationName: info.StationName,
        StationPosition: info.StationPosition,
        StationAddress: info.StationAddress,
        BikesCapacity: info.BikesCapacity
      };
    });
    return stationInfoCache;
  })
  .catch(error => {
    console.error('獲取YouBike站點資訊時出錯:', error);
    return {};
  });
}

// 渲染車站列表
function renderStationList(stations) {
  const stationList = document.getElementById('youbikeStationList');
  
  if (!stationList) return;
  
  if (!stations || stations.length === 0) {
    stationList.innerHTML = '<div class="no-data">沒有找到車站資料</div>';
    return;
  }
  
  // 先依據當前排序選項進行排序
  const sortSelect = document.getElementById('youbikeSort');
  const sortType = sortSelect ? sortSelect.value : 'name';
  sortStations(stations, sortType);
  
  // 渲染列表
  stationList.innerHTML = '';
  
  stations.forEach(station => {
    const stationDiv = document.createElement('div');
    stationDiv.className = 'analysis-item';
    stationDiv.style.marginBottom = '15px';
    stationDiv.style.backgroundColor = '#fff';
    stationDiv.style.borderRadius = '6px';
    stationDiv.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    stationDiv.style.overflow = 'hidden';
    
    const availableBikes = station.AvailableRentBikes || 0;
    const availableSpaces = station.AvailableReturnBikes || 0;
    const totalSpaces = availableBikes + availableSpaces;
    
    // 計算可借車百分比
    const rentPercentage = totalSpaces > 0 ? (availableBikes / totalSpaces) * 100 : 0;
    
    // 取得站名，如果不存在則顯示ID
    const stationName = station.StationName?.Zh_tw || `站點 ${station.StationID}`;
    // 取得站點地址，如果存在
    const stationAddress = station.StationAddress?.Zh_tw || '';
    
    stationDiv.innerHTML = `
      <div style="padding: 10px; border-bottom: 1px solid #f0f0f0;">
        <div style="font-weight: 600; margin-bottom: 5px;">${stationName}</div>
        <div style="font-size: 12px; color: #666;">
          ${stationAddress ? `<div>${stationAddress}</div>` : ''}
          <div>站點代號: ${station.StationUID || station.StationID}</div>
        </div>
      </div>
      <div style="display: flex; text-align: center;">
        <div style="flex: 1; padding: 10px; border-right: 1px solid #f0f0f0;">
          <div style="font-size: 20px; font-weight: 600; color: #e6a61e;">${availableBikes}</div>
          <div style="font-size: 12px; color: #666;">可借車輛</div>
        </div>
        <div style="flex: 1; padding: 10px;">
          <div style="font-size: 20px; font-weight: 600; color: #4682B4;">${availableSpaces}</div>
          <div style="font-size: 12px; color: #666;">可還空位</div>
        </div>
      </div>
      <div style="height: 8px; background-color: #f0f0f0;">
        <div style="height: 100%; width: ${rentPercentage}%; background-color: #e6a61e;"></div>
      </div>
    `;
    
    // 添加點擊事件以在地圖上定位
    stationDiv.addEventListener('click', () => {
      locateYouBikeStation(station);
    });
    
    stationList.appendChild(stationDiv);
  });
}

// 排序車站
function sortStations(stations, sortType) {
  switch(sortType) {
    case 'availableBikes':
      stations.sort((a, b) => (b.AvailableRentBikes || 0) - (a.AvailableRentBikes || 0));
      break;
    case 'availableSpaces':
      stations.sort((a, b) => (b.AvailableReturnBikes || 0) - (a.AvailableReturnBikes || 0));
      break;
    case 'name':
    default:
      stations.sort((a, b) => {
        const nameA = a.StationName?.Zh_tw || `站點 ${a.StationID}`;
        const nameB = b.StationName?.Zh_tw || `站點 ${b.StationID}`;
        return nameA.localeCompare(nameB);
      });
      break;
  }
}

// 過濾車站
function filterYouBikeStations() {
  const searchInput = document.getElementById('youbikeSearch');
  if (!searchInput) return;
  
  const searchText = searchInput.value.toLowerCase();
  
  if (!allYouBikeStations || allYouBikeStations.length === 0) {
    return;
  }
  
  const filteredStations = allYouBikeStations.filter(station => {
    const stationName = station.StationName?.Zh_tw || '';
    const stationAddress = station.StationAddress?.Zh_tw || '';
    const stationId = station.StationID || '';
    
    return stationName.toLowerCase().includes(searchText) || 
           stationAddress.toLowerCase().includes(searchText) ||
           stationId.includes(searchText);
  });
  
  renderStationList(filteredStations);
}

// 排序車站列表
function sortYouBikeStations() {
  const sortSelect = document.getElementById('youbikeSort');
  if (!sortSelect) return;
  
  const sortType = sortSelect.value;
  
  if (!allYouBikeStations || allYouBikeStations.length === 0) {
    return;
  }
  
  // 取得當前過濾的站點
  const searchInput = document.getElementById('youbikeSearch');
  const searchText = searchInput ? searchInput.value.toLowerCase() : '';
  
  const filteredStations = allYouBikeStations.filter(station => {
    const stationName = station.StationName?.Zh_tw || '';
    const stationAddress = station.StationAddress?.Zh_tw || '';
    const stationId = station.StationID || '';
    
    return stationName.toLowerCase().includes(searchText) || 
           stationAddress.toLowerCase().includes(searchText) ||
           stationId.includes(searchText);
  });
  
  sortStations(filteredStations, sortType);
  renderStationList(filteredStations);
}

// 在地圖上顯示所有 YouBike 站點
function showAllStationsOnMap(stations) {
  if (!window.view) return;
  
  // 創建一個 youbike 圖層來顯示所有站點
  cleanupYouBikeLayer(); // 清除之前的圖層
  
  require(["esri/layers/GraphicsLayer"], function(GraphicsLayer) {
    const youbikeLayer = new GraphicsLayer({
      id: "youbikeLayer",
      title: "YouBike 站點"
    });
    
    window.view.map.add(youbikeLayer);
    
    // 將站點添加到圖層
    addStationsToLayer(youbikeLayer, stations);
    
    // 在右側控制面板添加圖層開關
    addYouBikeLayerToggle();
  });
}

// 清除 YouBike 圖層
function cleanupYouBikeLayer() {
  if (!window.view) return;
  
  const youbikeLayer = window.view.map.findLayerById("youbikeLayer");
  if (youbikeLayer) {
    window.view.map.remove(youbikeLayer);
  }
}

// 將站點添加到圖層 (續)
function addStationsToLayer(layer, stations) {
    require(["esri/Graphic", "esri/symbols/SimpleMarkerSymbol", "esri/PopupTemplate"], 
      function(Graphic, SimpleMarkerSymbol, PopupTemplate) {
        // 過濾掉沒有有效位置的站點
        const validStations = stations.filter(station => 
          station.StationPosition?.PositionLon && station.StationPosition?.PositionLat
        );
        
        // 創建彈出視窗模板
        const popupTemplate = new PopupTemplate({
          title: "{stationName}",
          content: [
            {
              type: "fields",
              fieldInfos: [
                {
                  fieldName: "availableBikes",
                  label: "可借車輛",
                  visible: true
                },
                {
                  fieldName: "availableSpaces",
                  label: "可還空位",
                  visible: true
                },
                {
                  fieldName: "address",
                  label: "地址",
                  visible: true
                },
                {
                  fieldName: "updateTime",
                  label: "更新時間",
                  visible: true
                }
              ]
            }
          ]
        });
        
        validStations.forEach(station => {
          // 創建一個點位置
          const point = {
            type: "point",
            x: station.StationPosition.PositionLon,
            y: station.StationPosition.PositionLat,
            spatialReference: { wkid: 4326 } // WGS84
          };
          
          // 根據可用車輛數量計算顏色
          const availableBikes = station.AvailableRentBikes || 0;
          const availableSpaces = station.AvailableReturnBikes || 0;
          
          // 計算車輛可用比例來決定顏色
          let color;
          if (availableBikes === 0) {
            color = [220, 53, 69]; // 紅色 - 無車可借
          } else if (availableBikes < 3) {
            color = [255, 193, 7]; // 黃色 - 少量車輛
          } else {
            color = [40, 167, 69]; // 綠色 - 充足車輛
          }
          
          // 創建標記符號
          const markerSymbol = new SimpleMarkerSymbol({
            color: color,
            outline: {
              color: [255, 255, 255],
              width: 1
            },
            size: 8
          });
          
          // 準備彈出窗口屬性
          const stationName = station.StationName?.Zh_tw || `站點 ${station.StationID}`;
          const address = station.StationAddress?.Zh_tw || '';
          const updateTime = new Date(station.UpdateTime || Date.now()).toLocaleString();
          
          // 創建點圖形
          const pointGraphic = new Graphic({
            geometry: point,
            symbol: markerSymbol,
            attributes: {
              stationUID: station.StationUID,
              stationID: station.StationID,
              stationName: stationName,
              availableBikes: availableBikes,
              availableSpaces: availableSpaces,
              address: address,
              updateTime: updateTime
            },
            popupTemplate: popupTemplate
          });
          
          // 添加到圖層
          layer.add(pointGraphic);
        });
      }
    );
  }
  
  // 在右側面板添加 YouBike 圖層開關
  function addYouBikeLayerToggle() {
    // 檢查是否已經添加
    if (document.getElementById('youbikeLayerToggle')) return;
    
    // 找到圖層列表容器
    const layerListContainer = document.getElementById('layerlist-container');
    if (!layerListContainer) return;
    
    // 創建自定義控制項
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'esri-widget';
    toggleContainer.style.padding = '10px';
    toggleContainer.style.marginTop = '10px';
    toggleContainer.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <label for="youbikeLayerToggle" style="margin-right: 10px; font-weight: bold;">YouBike 站點圖層</label>
        <label class="switch">
          <input type="checkbox" id="youbikeLayerToggle" checked>
          <span class="slider round"></span>
        </label>
      </div>
      <div style="margin-top: 10px; font-size: 12px; color: #666;">
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
          <span style="width: 10px; height: 10px; background-color: rgb(40, 167, 69); display: inline-block; margin-right: 5px; border-radius: 50%;"></span>
          充足車輛
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 5px;">
          <span style="width: 10px; height: 10px; background-color: rgb(255, 193, 7); display: inline-block; margin-right: 5px; border-radius: 50%;"></span>
          少量車輛 (＜3)
        </div>
        <div style="display: flex; align-items: center;">
          <span style="width: 10px; height: 10px; background-color: rgb(220, 53, 69); display: inline-block; margin-right: 5px; border-radius: 50%;"></span>
          無車可借
        </div>
      </div>
    `;
    
    layerListContainer.appendChild(toggleContainer);
    
    // 添加事件監聽器
    document.getElementById('youbikeLayerToggle').addEventListener('change', function(e) {
      const youbikeLayer = window.view.map.findLayerById("youbikeLayer");
      if (youbikeLayer) {
        youbikeLayer.visible = e.target.checked;
      }
    });
  }
  // 添加 YouBike 分析功能到查詢面板
  function addYouBikeAnalysisToQueryPanel() {
    // 檢查是否已經添加
    if (document.getElementById('youbikeQuerySection')) return;
    
    // 找到查詢面板
    const queryDiv = document.getElementById('queryDiv');
    if (!queryDiv) return;
    
    // 創建 YouBike 查詢區段
    const youbikeSection = document.createElement('div');
    youbikeSection.id = 'youbikeQuerySection';
    youbikeSection.style.marginTop = '20px';
    youbikeSection.style.borderTop = '1px solid #ccc';
    youbikeSection.style.paddingTop = '15px';
    
    youbikeSection.innerHTML = `
      <b>YouBike 站點分析</b><br />
      <div style="margin-top: 10px;">
        <select id="youbikeAnalysisType" class="esri-button" style="width: 100%; padding: 8px;">
          <option value="nearest">尋找最近YouBike站點</option>
          <option value="coverage">自行車服務範圍分析</option>
        </select>
      </div>
      <div style="margin-top: 10px;">
        <button id="markPointForAnalysis" class="youbike-analysis-button">標記查詢點位</button>
      </div>
      <div style="margin-top: 10px;">
        <button id="runYouBikeAnalysis" class="youbike-analysis-button">執行分析</button>
      </div>
    `;
    
    queryDiv.appendChild(youbikeSection);
    
    // 添加事件監聽器
    document.getElementById('runYouBikeAnalysis').addEventListener('click', function() {
      const analysisType = document.getElementById('youbikeAnalysisType').value;
      
      if (analysisType === 'nearest') {
        findNearestYouBikeStation();
      } else if (analysisType === 'coverage') {
        analyzeYouBikeCoverage();
      }
    });
  }
  
  // 在地圖上定位 YouBike 站點
  function locateYouBikeStation(station) {
    // 如果有 map view
    if (window.view) {
      // 確認是否有有效的坐標
      if (!station.StationPosition?.PositionLon || !station.StationPosition?.PositionLat) {
        console.warn('站點位置資訊不完整:', station);
        alert('無法定位此站點，位置資料不完整');
        return;
      }
      
      // 創建一個點位置
      const point = {
        type: "point",
        x: station.StationPosition.PositionLon,
        y: station.StationPosition.PositionLat,
        spatialReference: { wkid: 4326 } // WGS84
      };
      
      // 飛行到該位置
      window.view.goTo({
        target: point,
        zoom: 18,
        tilt: 45
      }, {
        duration: 1000
      });
      
      // 查找可能的現有點並顯示其彈出窗口
      const youbikeLayer = window.view.map.findLayerById("youbikeLayer");
      if (youbikeLayer) {
        const stationUID = station.StationUID;
        
        // 查詢該圖層中與所選站點匹配的圖形
        const graphics = youbikeLayer.graphics.items;
        const targetGraphic = graphics.find(g => g.attributes && g.attributes.stationUID === stationUID);
        
        if (targetGraphic) {
          // 顯示彈出窗口
          window.view.popup.open({
            features: [targetGraphic],
            location: point
          });
          
          // 高亮顯示所選站點
          highlightSelectedStation(targetGraphic);
        } else {
          // 如果在圖層中找不到匹配的圖形，創建臨時標記
          createTemporaryHighlight(point, station);
        }
      } else {
        // 如果沒有YouBike圖層，創建臨時標記
        createTemporaryHighlight(point, station);
      }
    }
  }
  
  // 高亮顯示所選站點
  function highlightSelectedStation(graphic) {
    if (!window.view) return;
    
    // 清除現有高亮
    if (window.view.highlightOptions) {
      window.view.highlightOptions.remove();
    }
    
    // 應用高亮
    window.view.highlight(graphic);
    
    // 5秒後移除高亮
    setTimeout(() => {
      if (window.view.highlightOptions) {
        window.view.highlightOptions.remove();
      }
    }, 5000);
  }
  
  // 創建臨時高亮標記
  function createTemporaryHighlight(point, station) {
    // 創建臨時標記
    const graphicsLayer = window.view.map.findLayerById("youbikeHighlightLayer");
    
    // 如果 layer 不存在，創建一個新的
    if (!graphicsLayer) {
      require(["esri/layers/GraphicsLayer"], function(GraphicsLayer) {
        const newLayer = new GraphicsLayer({
          id: "youbikeHighlightLayer"
        });
        window.view.map.add(newLayer);
        addStationGraphic(newLayer, point, station);
      });
    } else {
      // 如果存在，清除之前的圖形並添加新的
      graphicsLayer.removeAll();
      addStationGraphic(graphicsLayer, point, station);
    }
  }
  
  // 在圖層上添加站點圖形
  function addStationGraphic(layer, point, station) {
    require(["esri/Graphic", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/TextSymbol"], 
      function(Graphic, SimpleMarkerSymbol, TextSymbol) {
        // 創建標記符號
        const markerSymbol = new SimpleMarkerSymbol({
          color: [230, 166, 30],
          outline: {
            color: [255, 255, 255],
            width: 2
          },
          size: 15
        });
        
        // 創建點圖形
        const pointGraphic = new Graphic({
          geometry: point,
          symbol: markerSymbol
        });
        
        // 創建標籤符號
        const stationName = station.StationName?.Zh_tw || `站點 ${station.StationID}`;
        const textSymbol = new TextSymbol({
          color: [50, 50, 50],
          haloColor: [255, 255, 255],
          haloSize: 1.5,
          text: stationName,
          font: {
            size: 12,
            family: "sans-serif",
            weight: "bold"
          },
          yoffset: -20
        });
        
        // 創建標籤圖形
        const textGraphic = new Graphic({
          geometry: point,
          symbol: textSymbol
        });
        
        // 添加到圖層
        layer.add(pointGraphic);
        layer.add(textGraphic);
        
        // 5秒後自動淡出
        setTimeout(() => {
          layer.removeAll();
        }, 5000);
      }
    );
  }
  
// 修改 findNearestYouBikeStation 函數
function findNearestYouBikeStation() {
    // 優先使用 youbikeAnalysisVars.lastQueryGeometry，若沒有再使用 window.sketchGeometry
    if (!youbikeAnalysisVars.lastQueryGeometry && !window.sketchGeometry) {
      alert('請先在地圖上標記一個點');
      return;
    }
    
    // 確保有有效的 YouBike 站點數據
    if (!allYouBikeStations || allYouBikeStations.length === 0) {
      alert('YouBike 站點數據尚未載入，請先載入數據');
      return;
    }
    
    // 取得使用者選擇的點，優先使用 youbikeAnalysisVars.lastQueryGeometry
    let userPoint = youbikeAnalysisVars.lastQueryGeometry || window.sketchGeometry;
    
    if (userPoint.type !== 'point') {
      // 如果不是點，則使用幾何中心
      const extent = userPoint.extent;
      userPoint = {
        type: 'point',
        x: (extent.xmin + extent.xmax) / 2,
        y: (extent.ymin + extent.ymax) / 2,
        spatialReference: userPoint.spatialReference
      };
    }
    
    // 保存查詢幾何供後續分析使用
    youbikeAnalysisVars.lastQueryGeometry = userPoint;
    
    // 計算與每個站點的距離
    require(["esri/geometry/geometryEngine"], function(geometryEngine) {
      const validStations = allYouBikeStations.filter(station => 
        station.StationPosition?.PositionLon && station.StationPosition?.PositionLat
      );
      
      // 轉換站點坐標為點幾何
      const stationPoints = validStations.map(station => {
        return {
          station: station,
          geometry: {
            type: 'point',
            x: station.StationPosition.PositionLon,
            y: station.StationPosition.PositionLat,
            spatialReference: { wkid: 4326 }
          }
        };
      });
      
      // 計算每個站點與用戶點的距離
      const stationsWithDistance = stationPoints.map(sp => {
        const distance = geometryEngine.distance(
          userPoint,
          sp.geometry,
          'meters'
        );
        
        return {
          station: sp.station,
          distance: distance
        };
      });
      // 找出最近的5個站點
      const nearestStations = stationsWithDistance
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);
      
      // 顯示結果
      showNearestStationResults(nearestStations);
      
      // 在地圖上顯示
      highlightNearestStations(nearestStations, userPoint);
    });
  }
  
  // 顯示最近站點結果
  function showNearestStationResults(nearestStations) {
    // 找到或創建結果容器
    ensureResultsContainer();
    
    let resultContainer = document.getElementById('youbikeAnalysisResults');
    
    // 如果仍然找不到容器，退出
    if (!resultContainer) return;
    
    // 顯示結果
    resultContainer.innerHTML = `
      <h4>最近的 YouBike 站點</h4>
      <div class="nearest-stations">
        ${nearestStations.map((item, index) => {
          const station = item.station;
          const stationName = station.StationName?.Zh_tw || `站點 ${station.StationID}`;
          const availableBikes = station.AvailableRentBikes || 0;
          const availableSpaces = station.AvailableReturnBikes || 0;
          
          return `
            <div class="analysis-item" style="cursor: pointer;" data-station-uid="${station.StationUID}">
              <div style="display: flex; justify-content: space-between; width: 100%;">
                <div>
                  <div style="font-weight: bold;">${index + 1}. ${stationName}</div>
                  <div style="font-size: 12px; color: #666;">距離: ${item.distance.toFixed(0)} 公尺</div>
                </div>
                <div style="text-align: right;">
                  <div style="color: #e6a61e; font-weight: bold;">${availableBikes} 可借</div>
                  <div style="color: #4682B4;">${availableSpaces} 可還</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
    // 為每個站點添加點擊事件
    document.querySelectorAll('.nearest-stations .analysis-item').forEach(item => {
      item.addEventListener('click', function() {
        const stationUID = this.getAttribute('data-station-uid');
        const station = allYouBikeStations.find(s => s.StationUID === stationUID);
        
        if (station) {
          locateYouBikeStation(station);
        }
      });
    });
  }
  
  // 確保結果容器存在
  function ensureResultsContainer() {
    // 如果已存在則返回
    if (document.getElementById('youbikeAnalysisResults')) return;
    
    // 找到右側面板
    const rightPanel = document.getElementById('resultDiv');
    if (!rightPanel) return;
    
    // 檢查是否有 results-container
    let resultsContainer = rightPanel.querySelector('.results-container');
    
    if (!resultsContainer) {
      resultsContainer = document.createElement('div');
      resultsContainer.className = 'results-container';
      rightPanel.appendChild(resultsContainer);
    }
    
    // 添加 YouBike 分析結果區段
    const youbikeSection = document.createElement('div');
    youbikeSection.innerHTML = `
      <div class="section-header">YouBike 分析結果</div>
      <div id="youbikeAnalysisResults" class="analysis-section"></div>
    `;
    
    resultsContainer.appendChild(youbikeSection);
  }
  
  // 在地圖上高亮顯示最近的站點
  function highlightNearestStations(nearestStations, userPoint) {
    if (!window.view) return;
    
    // 創建或清空高亮圖層
    let highlightLayer = window.view.map.findLayerById('youbikeNearestLayer');
    
    if (!highlightLayer) {
      require(["esri/layers/GraphicsLayer"], function(GraphicsLayer) {
        highlightLayer = new GraphicsLayer({
          id: 'youbikeNearestLayer'
        });
        window.view.map.add(highlightLayer);
        
        // 設置為當前分析圖層
        youbikeAnalysisVars.activeAnalysisLayer = highlightLayer;
        
        addNearestStationsGraphics(highlightLayer, nearestStations, userPoint);
      });
    } else {
      highlightLayer.removeAll();
      
      // 設置為當前分析圖層
      youbikeAnalysisVars.activeAnalysisLayer = highlightLayer;
      
      addNearestStationsGraphics(highlightLayer, nearestStations, userPoint);
    }
  }
  
  // 添加最近站點的圖形
  function addNearestStationsGraphics(layer, nearestStations, userPoint) {
    require(["esri/Graphic", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/geometry/Polyline"], 
      function(Graphic, SimpleMarkerSymbol, SimpleLineSymbol, Polyline) {
        // 添加用戶位置點
        const userSymbol = new SimpleMarkerSymbol({
          color: [0, 0, 255],
          outline: {
            color: [255, 255, 255],
            width: 2
          },
          size: 12
        });
        
        const userGraphic = new Graphic({
          geometry: userPoint,
          symbol: userSymbol
        });
        
        layer.add(userGraphic);
        
        // 添加最近的站點和連線
        nearestStations.forEach((item, index) => {
          const station = item.station;
          
          if (!station.StationPosition?.PositionLon || !station.StationPosition?.PositionLat) {
            return;
          }
          
          // 站點位置
          const stationPoint = {
            type: 'point',
            x: station.StationPosition.PositionLon,
            y: station.StationPosition.PositionLat,
            spatialReference: { wkid: 4326 }
          };
          
          // 站點符號 - 使用漸變顏色以顯示距離順序
          const colors = [
            [255, 0, 0], // 紅色 - 最近
            [255, 128, 0], // 橙色
            [255, 255, 0], // 黃色
            [128, 255, 0], // 黃綠色
            [0, 255, 0] // 綠色 - 最遠
          ];
          
          const stationSymbol = new SimpleMarkerSymbol({
            color: colors[index > 4 ? 4 : index],
            outline: {
              color: [255, 255, 255],
              width: 1
            },
            size: 12 - index // 使最近的站點顯示得更大
          });
          
          const stationGraphic = new Graphic({
            geometry: stationPoint,
            symbol: stationSymbol,
            attributes: {
              stationName: station.StationName?.Zh_tw || `站點 ${station.StationID}`,
              distance: item.distance
            },
            popupTemplate: {
              title: "{stationName}",
              content: "距離: {distance} 公尺"
            }
          });
          
          layer.add(stationGraphic);
          
          // 添加連線
          const path = [
            [userPoint.x, userPoint.y],
            [stationPoint.x, stationPoint.y]
          ];
          
          const polyline = new Polyline({
            paths: [path],
            spatialReference: userPoint.spatialReference
          });
          
          const lineSymbol = new SimpleLineSymbol({
            color: colors[index > 4 ? 4 : index],
            width: 2,
            style: "dash"
          });
          
          const lineGraphic = new Graphic({
            geometry: polyline,
            symbol: lineSymbol
          });
          
          layer.add(lineGraphic);
        });
      }
    );
  }
  
  // 分析 YouBike 服務覆蓋範圍
  function analyzeYouBikeCoverage() {
    if (!window.view || !allYouBikeStations || allYouBikeStations.length === 0) {
      alert('請確保 YouBike 站點數據已載入');
      return;
    }
    
    // 預設服務半徑 (300公尺)
    const serviceRadius = youbikeAnalysisVars.serviceRadius;
    
    // 過濾出有效坐標的站點
    const validStations = allYouBikeStations.filter(station => 
      station.StationPosition?.PositionLon && station.StationPosition?.PositionLat
    );
    
    // 創建或清空覆蓋範圍圖層
    let coverageLayer = window.view.map.findLayerById('youbikeCoverageLayer');
    
    if (!coverageLayer) {
      require(["esri/layers/GraphicsLayer"], function(GraphicsLayer) {
        coverageLayer = new GraphicsLayer({
          id: 'youbikeCoverageLayer',
          title: 'YouBike 服務範圍'
        });
        window.view.map.add(coverageLayer);
        
        // 設置為當前分析圖層
        youbikeAnalysisVars.activeAnalysisLayer = coverageLayer;
        
        addCoverageGraphics(coverageLayer, validStations, serviceRadius);
      });
    } else {
      coverageLayer.removeAll();
      
      // 設置為當前分析圖層
      youbikeAnalysisVars.activeAnalysisLayer = coverageLayer;
      
      addCoverageGraphics(coverageLayer, validStations, serviceRadius);
    }
  }
  // 添加覆蓋範圍圖形
function addCoverageGraphics(layer, stations, radius) {
    require(["esri/Graphic", "esri/geometry/Circle", "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleMarkerSymbol"], 
      function(Graphic, Circle, SimpleFillSymbol, SimpleMarkerSymbol) {
        // 在烏日區創建服務範圍
        const wuriStations = stations.filter(station => {
          const stationName = station.StationName?.Zh_tw || '';
          const stationAddress = station.StationAddress?.Zh_tw || '';
          return stationName.includes('烏日') || stationAddress.includes('烏日');
        });
        
        // 如果沒有烏日站點，使用所有站點
        const stationsToShow = wuriStations.length > 0 ? wuriStations : stations;
        
        // 為每個站點創建覆蓋範圍
        stationsToShow.forEach(station => {
          // 站點位置
          const center = {
            type: 'point',
            x: station.StationPosition.PositionLon,
            y: station.StationPosition.PositionLat,
            spatialReference: { wkid: 4326 }
          };
          
          // 創建圓形緩衝區
          const circle = new Circle({
            center: center,
            radius: radius,
            radiusUnit: 'meters',
            spatialReference: { wkid: 4326 }
          });
          
          // 覆蓋範圍符號
          const coverageSymbol = new SimpleFillSymbol({
            color: [0, 100, 255, 0.2],
            outline: {
              color: [0, 100, 255, 0.6],
              width: 1
            }
          });
          
          // 創建覆蓋範圍圖形
          const coverageGraphic = new Graphic({
            geometry: circle,
            symbol: coverageSymbol,
            attributes: {
              stationName: station.StationName?.Zh_tw || `站點 ${station.StationID}`,
              availableBikes: station.AvailableRentBikes || 0,
              serviceRadius: radius
            },
            popupTemplate: {
              title: "{stationName}",
              content: [
                {
                  type: "text",
                  text: "服務半徑: {serviceRadius} 公尺"
                },
                {
                  type: "text",
                  text: "可借車輛: {availableBikes}"
                }
              ]
            }
          });
          
          layer.add(coverageGraphic);
          
          // 添加站點中心點
          const stationSymbol = new SimpleMarkerSymbol({
            color: [0, 100, 255],
            outline: {
              color: [255, 255, 255],
              width: 1
            },
            size: 6
          });
          
          const stationGraphic = new Graphic({
            geometry: center,
            symbol: stationSymbol
          });
          
          layer.add(stationGraphic);
        });
        
        // 分析覆蓋情況並顯示結果
        analyzeAndShowCoverageResults(stationsToShow, radius);
      }
    );
  }
  
  // 分析並顯示覆蓋結果
  function analyzeAndShowCoverageResults(stations, radius) {
    // 確保結果容器存在
    ensureResultsContainer();
    
    let resultContainer = document.getElementById('youbikeAnalysisResults');
    
    // 如果仍然找不到容器，退出
    if (!resultContainer) return;
    
    // 計算統計數據
    const totalStations = stations.length;
    const totalBikes = stations.reduce((sum, station) => sum + (station.AvailableRentBikes || 0), 0);
    const totalSpace = stations.reduce((sum, station) => sum + (station.AvailableReturnBikes || 0), 0);
    const averageBikesPerStation = totalStations > 0 ? (totalBikes / totalStations).toFixed(1) : 0;
    
    // 計算服務範圍面積 (近似值，忽略重疊)
    const singleStationArea = Math.PI * radius * radius; // 平方公尺
    const totalCoverageArea = singleStationArea * totalStations / 1000000; // 平方公里
    
    // 顯示結果
    resultContainer.innerHTML = `
      <h4>YouBike 服務覆蓋分析</h4>
      <div class="analysis-item">
        <span class="label">服務半徑</span>
        <span class="value">${radius} 公尺</span>
      </div>
      <div class="analysis-item">
        <span class="label">站點數量</span>
        <span class="value">${totalStations} 個</span>
      </div>
      <div class="analysis-item">
        <span class="label">可借車輛總數</span>
        <span class="value">${totalBikes} 輛</span>
      </div>
      <div class="analysis-item">
        <span class="label">可還空位總數</span>
        <span class="value">${totalSpace} 個</span>
      </div>
      <div class="analysis-item">
        <span class="label">平均每站可借</span>
        <span class="value">${averageBikesPerStation} 輛</span>
      </div>
      <div class="analysis-item">
        <span class="label">總覆蓋面積 (簡略)</span>
        <span class="value">${totalCoverageArea.toFixed(2)} 平方公里</span>
      </div>
    `;
  }
  
  // 與選址系統整合的分析功能
  function integrateWithSiteSelection() {
    // 整合與現有選址系統的分析結果
    const integrationInterval = setInterval(() => {
      // 查看是否有活躍的分析圖層
      if (youbikeAnalysisVars.activeAnalysisLayer && 
          youbikeAnalysisVars.lastQueryGeometry && 
          window.view) {
        
        // 查看是否有評估結果區域
        const evaluationDiv = document.getElementById('evaluationResults');
        if (!evaluationDiv) return;
        
        // 檢查是否已有整合區域
        if (document.getElementById('youbikeIntegrationResult')) return;
        
        // 獲取當前區域的站點密度
        require(["esri/geometry/geometryEngine"], function(geometryEngine) {
          // 設定檢查半徑 (300 公尺)
          const checkRadius = 300;
          
          // 創建檢查緩衝區
          const buffer = geometryEngine.geodesicBuffer(
            youbikeAnalysisVars.lastQueryGeometry, 
            checkRadius, 
            "meters"
          );
          
          // 過濾有效站點
          const validStations = allYouBikeStations.filter(station => 
            station.StationPosition?.PositionLon && station.StationPosition?.PositionLat
          );
          
          // 檢查緩衝區內的站點數量
          const stationsInBuffer = validStations.filter(station => {
            const stationPoint = {
              type: 'point',
              x: station.StationPosition.PositionLon,
              y: station.StationPosition.PositionLat,
              spatialReference: { wkid: 4326 }
            };
            
            return geometryEngine.contains(buffer, stationPoint);
          });
          
          // 計算站點密度指標
          const stationCount = stationsInBuffer.length;
          const score = Math.max(0, 100 - stationCount * 25);
          
          // 添加到評估結果中
          const integrationDiv = document.createElement('div');
          integrationDiv.id = 'youbikeIntegrationResult';
          integrationDiv.innerHTML = `
            <div class="score-item">
              <div class="score-label">現有站點情況 (${stationCount}個)</div>
              <div class="score-value">${score.toFixed(1)}</div>
            </div>
          `;
          
          // 添加到評估結果的 score-details 中
          const scoreDetails = evaluationDiv.querySelector('.score-details');
          if (scoreDetails) {
            scoreDetails.appendChild(integrationDiv);
          }
        });
        
        // 整合成功後清除定時器
        clearInterval(integrationInterval);
      }
    }, 3000);
  }
  
  // 監聽現有系統的查詢操作
  function watchSystemQuery() {
    // 監視用戶在系統中的查詢操作
    if (window.runQuery) {
      // 保存原始的查詢函數
      const originalRunQuery = window.runQuery;
      
      // 重新定義查詢函數
      window.runQuery = function() {
        // 執行原始查詢
        const result = originalRunQuery.apply(this, arguments);
        
        // 獲取查詢幾何體
        if (window.sketchGeometry) {
          youbikeAnalysisVars.lastQueryGeometry = window.sketchGeometry;
          
          // 延遲執行整合
          setTimeout(() => {
            integrateWithSiteSelection();
          }, 1000);
        }
        
        return result;
      };
    }
  }
  
  // 在頁面載入時初始化 TDX 整合
  window.addEventListener('load', function() {
    // 確保網頁完全載入後再初始化
    setTimeout(() => {
      initTDXIntegration();
      watchSystemQuery();
    }, 1000);
  });