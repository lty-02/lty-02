/**
 * 簡化版 YouBike 點標記功能
 * 專注於尋找最近 YouBike 站點
 */

(function() {
  // 初始化全局變數
  if (typeof window.youbikeMarkerUtils === 'undefined') {
    window.youbikeMarkerUtils = {
      markerLayer: null,
      isMarkingPoint: false,
      lastMarkedPoint: null,
      tooltipElement: null,
      initialized: false
    };
  }

  // 當頁面完全載入後執行初始化
  window.addEventListener('load', function() {
    console.log('簡化版 YouBike 點標記功能: 頁面載入完成');
    
    // 多次嘗試初始化
    setTimeout(initMarkerFeature, 1000);
    setTimeout(initMarkerFeature, 3000);
    setTimeout(initMarkerFeature, 5000);
    
    // 使用MutationObserver持續監視DOM變化
    observeDOM();
  });

  // 監視DOM變化
  function observeDOM() {
    const observer = new MutationObserver(function(mutations) {
      if (!window.youbikeMarkerUtils.initialized) {
        initMarkerFeature();
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // 主初始化函數 
  function initMarkerFeature() {
    // 避免重複初始化
    if (window.youbikeMarkerUtils.initialized) {
      return;
    }
    
    // 檢查必要元素是否已加載
    const youbikeQuerySection = document.getElementById('youbikeQuerySection');
    if (!youbikeQuerySection) {
      console.log('YouBike查詢部分尚未載入');
      return;
    }
    
    // 初始化圖層
    initMarkerLayer();
    
    // 檢查並添加標記按鈕
    addMarkerButton();
    
    // 標記為已初始化
    window.youbikeMarkerUtils.initialized = true;
    console.log('點標記功能初始化完成');
  }

  // 初始化標記圖層
  function initMarkerLayer() {
    if (!window.view) {
      console.log('地圖視圖尚未初始化');
      return;
    }

    require(["esri/layers/GraphicsLayer"], function(GraphicsLayer) {
      // 檢查圖層是否已存在
      if (window.view.map.findLayerById('youbikeMarkerLayer')) {
        window.youbikeMarkerUtils.markerLayer = window.view.map.findLayerById('youbikeMarkerLayer');
        return;
      }

      // 創建標記圖層
      const markerLayer = new GraphicsLayer({
        id: 'youbikeMarkerLayer',
        title: 'YouBike 分析標記'
      });
      
      // 添加到地圖
      window.view.map.add(markerLayer);
      
      // 保存到工具變數
      window.youbikeMarkerUtils.markerLayer = markerLayer;
      
      // 添加點擊事件監聽
      window.view.on('click', handleMapClick);
    });
  }

  // 添加標記按鈕
  function addMarkerButton() {
    const youbikeQuerySection = document.getElementById('youbikeQuerySection');
    
    // 如果已存在標記按鈕，不再添加
    if (document.getElementById('markPointForAnalysis')) {
      return;
    }
    
    // 創建按鈕
    const markPointBtn = document.createElement('button');
    markPointBtn.id = 'markPointForAnalysis';
    markPointBtn.className = 'youbike-analysis-button';
    markPointBtn.innerText = '標記查詢點位';
    
    // 添加到查詢部分
    youbikeQuerySection.appendChild(markPointBtn);
    
    // 添加事件監聽器
    markPointBtn.addEventListener('click', togglePointMarking);
    
    // 修改執行分析按鈕
    enhanceAnalysisButton();
  }

  // 增強分析按鈕
  function enhanceAnalysisButton() {
    const runYouBikeAnalysisBtn = document.getElementById('runYouBikeAnalysis');
    
    if (runYouBikeAnalysisBtn && !runYouBikeAnalysisBtn._enhanced) {
      // 標記為已增強
      runYouBikeAnalysisBtn._enhanced = true;
      
      // 保存原始事件
      const originalOnClick = runYouBikeAnalysisBtn.onclick;
      
      // 替換事件
      runYouBikeAnalysisBtn.onclick = function(event) {
        // 檢查是否有標記點位
        if (!window.youbikeMarkerUtils.lastMarkedPoint) {
          showTooltipMessage('請先標記查詢點位');
          setTimeout(hideTooltipMessage, 3000);
          return;
        }
        
        // 更新全局點位資訊
        window.sketchGeometry = window.youbikeMarkerUtils.lastMarkedPoint;
        if (window.youbikeAnalysisVars) {
          window.youbikeAnalysisVars.lastQueryGeometry = window.youbikeMarkerUtils.lastMarkedPoint;
        }
        
        // 調用原始事件
        if (typeof originalOnClick === 'function') {
          originalOnClick.call(this, event);
        }
      };
    }
  }

  // 切換點標記模式
  function togglePointMarking() {
    window.youbikeMarkerUtils.isMarkingPoint = !window.youbikeMarkerUtils.isMarkingPoint;
    
    // 更新按鈕外觀
    const markPointBtn = document.getElementById('markPointForAnalysis');
    if (markPointBtn) {
      if (window.youbikeMarkerUtils.isMarkingPoint) {
        markPointBtn.innerHTML = '點擊地圖以標記位置 <span style="font-size:16px">⟲</span>';
        markPointBtn.style.backgroundColor = '#d4941b';
        
        // 變更游標樣式
        document.getElementById('viewDiv').style.cursor = 'crosshair';
        
        // 顯示提示消息
        showTooltipMessage('請點擊地圖上的位置以標記查詢點位');
      } else {
        markPointBtn.innerHTML = '標記查詢點位';
        markPointBtn.style.backgroundColor = '';
        
        // 恢復游標樣式
        document.getElementById('viewDiv').style.cursor = '';
        
        // 移除提示消息
        hideTooltipMessage();
      }
    }
  }

  // 處理地圖點擊
  function handleMapClick(event) {
    // 如果不在標記模式，直接返回
    if (!window.youbikeMarkerUtils.isMarkingPoint) return;
    
    // 停止事件傳播
    event.stopPropagation();
    
    // 建立分析點
    createAnalysisPoint(event.mapPoint);
    
    // 關閉標記模式
    togglePointMarking();
    
    return false;
  }

  // 創建分析點
  function createAnalysisPoint(point) {
    if (!window.youbikeMarkerUtils.markerLayer) return;
    
    // 清除舊標記
    window.youbikeMarkerUtils.markerLayer.removeAll();
    
    require(["esri/Graphic", "esri/symbols/SimpleMarkerSymbol"], 
      function(Graphic, SimpleMarkerSymbol) {
        // 保存點位
        window.youbikeMarkerUtils.lastMarkedPoint = point;
        
        // 更新全局點位資訊
        window.sketchGeometry = point;
        if (window.youbikeAnalysisVars) {
          window.youbikeAnalysisVars.lastQueryGeometry = point;
        }
        
        // 創建標記符號
        const markerSymbol = new SimpleMarkerSymbol({
          color: [230, 166, 30],
          outline: {
            color: [255, 255, 255],
            width: 2
          },
          size: 12
        });
        
        // 建立點圖形
        const pointGraphic = new Graphic({
          geometry: point,
          symbol: markerSymbol
        });
        
        // 添加到標記圖層
        window.youbikeMarkerUtils.markerLayer.add(pointGraphic);
        
        // 顯示提示消息
        showTooltipMessage('點位已標記，現在可以執行查詢');
        setTimeout(hideTooltipMessage, 3000);
      }
    );
  }

  // 顯示提示消息
  function showTooltipMessage(message) {
    // 清除任何已存在的提示
    hideTooltipMessage();
    
    // 創建新提示
    const tooltip = document.createElement('div');
    tooltip.id = 'youbike-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.top = '150px';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';
    tooltip.style.backgroundColor = 'rgba(0,0,0,0.8)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '10px 15px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.zIndex = '9999';
    tooltip.style.pointerEvents = 'none';
    tooltip.textContent = message;
    
    document.body.appendChild(tooltip);
    window.youbikeMarkerUtils.tooltipElement = tooltip;
  }

  // 隱藏提示消息
  function hideTooltipMessage() {
    const tooltip = document.getElementById('youbike-tooltip');
    if (tooltip) {
      tooltip.remove();
      window.youbikeMarkerUtils.tooltipElement = null;
    }
  }

  // 將模組功能暴露給全局
  window.youbikeMarkerUtils.createAnalysisPoint = createAnalysisPoint;
  window.youbikeMarkerUtils.showTooltipMessage = showTooltipMessage;
  window.youbikeMarkerUtils.hideTooltipMessage = hideTooltipMessage;
})();