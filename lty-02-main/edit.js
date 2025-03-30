/**
 * 將YouBike車位圖層開關與圖例移至左側與街景按鈕放在一起
 * 並從圖層切換頁籤中移除原有開關
 */

(function() {
    // 等待DOM加載完成後執行
    window.addEventListener('load', function() {
      // 設置延遲，確保其他元素已加載
      setTimeout(moveYoubikeLayerToggle, 1000);
      // 多次嘗試，以確保一定能執行成功
      setTimeout(moveYoubikeLayerToggle, 3000);
      setTimeout(moveYoubikeLayerToggle, 5000);
    });
  
    // 將YouBike車位圖層開關與圖例移至左側
    function moveYoubikeLayerToggle() {
      console.log('開始移動YouBike車位圖層開關與圖例...');
      
      // 檢查是否已經移動過
      if (document.getElementById('left-side-controls')) {
        console.log('左側控制容器已存在');
        return;
      }
      
      // 尋找原有的YouBike圖層開關
      const originalToggle = document.getElementById('youbikeLayerToggle');
      if (!originalToggle) {
        console.log('未找到原始YouBike圖層開關，稍後再試');
        return;
      }
      
      // 尋找街景按鈕
      const streetViewBtn = document.getElementById('toggleStreetView');
      if (!streetViewBtn) {
        console.log('未找到街景按鈕，稍後再試');
        return;
      }
      
      // 尋找原始開關的父元素以獲取完整內容
      let toggleContainer = null;
      
      // 嘗試不同的方式找到父容器
      // 1. 首先嘗試找到className中包含'youbike-layer-toggle'的容器
      const youbikeLayerToggles = document.querySelectorAll('.youbike-layer-toggle, [class*="youbike"][class*="layer"]');
      if (youbikeLayerToggles.length > 0) {
        toggleContainer = youbikeLayerToggles[0];
      }
      
      // 2. 如果上面的方法找不到，嘗試向上查找最近的容器
      if (!toggleContainer) {
        let parent = originalToggle.parentElement;
        while (parent && !toggleContainer) {
          if (parent.className && 
              (parent.className.includes('esri-widget') || 
               parent.className.includes('layer') || 
               parent.className.includes('toggle'))) {
            toggleContainer = parent;
          }
          parent = parent.parentElement;
        }
      }
      
      // 如果仍找不到容器，則嘗試直接使用開關的父元素
      if (!toggleContainer && originalToggle.parentElement) {
        toggleContainer = originalToggle.parentElement.closest('div');
      }
      
      // 尋找圖例內容
      let legendContent = '';
      if (toggleContainer) {
        // 尋找圖例元素
        const legendElement = toggleContainer.querySelector('.youbike-legend') || 
                             toggleContainer.querySelector('[class*="legend"]') ||
                             toggleContainer.querySelector('div[style*="margin-top"]');
        
        if (legendElement) {
          legendContent = legendElement.outerHTML;
        } else {
          // 如果找不到特定的圖例元素，檢查是否有含有顏色點的元素 (可能的圖例項)
          const legendItems = toggleContainer.querySelectorAll('div[style*="display: flex"][style*="align-items: center"]');
          if (legendItems.length > 0) {
            legendContent = '<div class="youbike-legend" style="margin-top: 10px; font-size: 12px;">';
            legendItems.forEach(item => {
              legendContent += item.outerHTML;
            });
            legendContent += '</div>';
          }
        }
      }
      
      // 如果找不到圖例內容，提供默認的圖例
      if (!legendContent) {
        legendContent = `
          <div class="youbike-legend" style="margin-top: 10px; font-size: 12px;">
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
      }
      
      // 創建左側控制容器
      const leftControls = document.createElement('div');
      leftControls.id = 'left-side-controls';
      leftControls.style.position = 'absolute';
      leftControls.style.left = '20px';
      leftControls.style.bottom = '300px'; // 調整高度，使其在街景按鈕上方
      leftControls.style.zIndex = '1000';
      leftControls.style.backgroundColor = 'white';
      leftControls.style.padding = '10px';
      leftControls.style.borderRadius = '4px';
      leftControls.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      leftControls.style.display = 'flex';
      leftControls.style.flexDirection = 'column';
      leftControls.style.gap = '10px';
      leftControls.style.maxWidth = '250px';
      
      // 1. 添加YouBike圖層開關和圖例
      const youbikeControlDiv = document.createElement('div');
      youbikeControlDiv.id = 'left-youbike-control';
      
      // 添加開關部分
      youbikeControlDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <label style="margin-right: 10px; font-weight: bold;">YouBike 站點圖層</label>
          <label class="switch">
            <input type="checkbox" id="leftYoubikeLayerToggle" checked>
            <span class="slider round"></span>
          </label>
        </div>
        ${legendContent}
      `;
      
      // 添加到左側控制容器
      leftControls.appendChild(youbikeControlDiv);
      
      // 2. 添加街景按鈕（複製原按鈕）
      const streetViewClone = streetViewBtn.cloneNode(true);
      streetViewClone.id = 'leftToggleStreetView';
      streetViewClone.style.position = 'static'; // 移除絕對定位
      streetViewClone.style.bottom = 'auto';
      streetViewClone.style.left = 'auto';
      leftControls.appendChild(streetViewClone);
      
      // 將左側控制容器添加到地圖容器
      const viewDiv = document.getElementById('viewDiv');
      if (viewDiv) {
        viewDiv.appendChild(leftControls);
        console.log('成功將控制元素移至左側');
        
        // 連接新開關的事件處理
        const newToggle = document.getElementById('leftYoubikeLayerToggle');
        if (newToggle && originalToggle) {
          newToggle.checked = originalToggle.checked;
          
          // 同步狀態（雙向綁定）
          newToggle.addEventListener('change', function() {
            originalToggle.checked = newToggle.checked;
            const event = new Event('change');
            originalToggle.dispatchEvent(event);
          });
          
          originalToggle.addEventListener('change', function() {
            newToggle.checked = originalToggle.checked;
          });
        }
        
        // 連接街景按鈕事件
        streetViewClone.addEventListener('click', function() {
          // 觸發原始按鈕的點擊事件
          streetViewBtn.click();
        });
        
        // 隱藏原始街景按鈕
        streetViewBtn.style.display = 'none';
        
        // 從原位置移除YouBike圖層開關
        removeOriginalYoubikeToggle(toggleContainer, originalToggle);
      } else {
        console.log('找不到地圖容器(viewDiv)');
      }
    }
  
    // 從原位置移除YouBike圖層開關
    function removeOriginalYoubikeToggle(toggleContainer, originalToggle) {
      if (!toggleContainer) return;
      
      try {
        // 嘗試移除整個容器
        if (toggleContainer.parentElement) {
          toggleContainer.parentElement.removeChild(toggleContainer);
          console.log('已從原位置移除YouBike圖層開關');
          return;
        }
        
        // 如果無法移除整個容器，嘗試隱藏它
        toggleContainer.style.display = 'none';
      } catch (e) {
        console.log('無法移除原始YouBike圖層開關:', e);
        
        // 如果移除出錯，至少嘗試隱藏原始開關
        if (originalToggle && originalToggle.parentElement) {
          try {
            // 嘗試隱藏整個開關的父元素
            let parent = originalToggle.parentElement;
            while (parent && !parent.classList.contains('esri-widget')) {
              parent.style.display = 'none';
              parent = parent.parentElement;
              if (parent.classList.contains('esri-widget')) {
                break;
              }
            }
          } catch (err) {
            console.log('隱藏原始開關失敗:', err);
          }
        }
      }
    }
  })();

  /**
 * 完全移除YouBike站點分析的所有功能與UI元素
 * 包括分析區塊、按鈕、結果區域等
 */

(function() {
    // 在頁面載入後執行
    window.addEventListener('load', function() {
      // 多次嘗試，確保能夠移除元素
      setTimeout(removeYouBikeAnalysis, 1000);
      setTimeout(removeYouBikeAnalysis, 3000);
      setTimeout(removeYouBikeAnalysis, 5000);
    });
  
    // 移除YouBike站點分析的所有相關元素
    function removeYouBikeAnalysis() {
      console.log('開始移除YouBike站點分析功能...');
      
      // 1. 移除分析區塊（查詢面板中的分析部分）
      removeYouBikeQuerySection();
      
      // 2. 移除分析結果區域
      removeYouBikeResults();
      
      // 3. 移除分析相關的全局函數
      disableAnalysisFunctions();
      
      // 4. 移除分析圖層
      removeAnalysisLayers();
      
      console.log('YouBike站點分析功能移除完成');
    }
  
    // 1. 移除查詢面板中的YouBike分析區塊
    function removeYouBikeQuerySection() {
      // 查找分析區塊
      const querySection = document.getElementById('youbikeQuerySection');
      if (querySection && querySection.parentElement) {
        querySection.parentElement.removeChild(querySection);
        console.log('已移除YouBike分析區塊');
      } else {
        // 如果找不到具體ID，嘗試查找其他相關元素
        const queryDiv = document.getElementById('queryDiv');
        if (queryDiv) {
          // 查找包含YouBike站點分析字樣的元素
          const youbikeElements = Array.from(queryDiv.querySelectorAll('*')).filter(el => {
            if (el.textContent && typeof el.textContent === 'string') {
              return el.textContent.includes('YouBike 站點分析');
            }
            return false;
          });
          
          // 向上查找父元素並移除
          youbikeElements.forEach(el => {
            let parent = el;
            // 向上查找最多3層，找到可能的分析區塊容器
            for (let i = 0; i < 3; i++) {
              if (parent.parentElement) {
                parent = parent.parentElement;
                if (parent.id === 'queryDiv') {
                  break;
                }
              }
            }
            if (parent !== queryDiv && parent.parentElement) {
              parent.parentElement.removeChild(parent);
              console.log('已移除可能的YouBike分析區塊');
            }
          });
        }
      }
      
      // 移除標記查詢點位按鈕
      const markButton = document.getElementById('markPointForAnalysis');
      if (markButton && markButton.parentElement) {
        markButton.parentElement.removeChild(markButton);
        console.log('已移除標記查詢點位按鈕');
      }
      
      // 移除執行分析按鈕
      const runButton = document.getElementById('runYouBikeAnalysis');
      if (runButton && runButton.parentElement) {
        runButton.parentElement.removeChild(runButton);
        console.log('已移除執行分析按鈕');
      }
    }
  
    // 2. 移除分析結果區域
    function removeYouBikeResults() {
      // 移除分析結果容器
      const resultsContainer = document.getElementById('youbikeAnalysisResults');
      if (resultsContainer && resultsContainer.parentElement) {
        resultsContainer.parentElement.removeChild(resultsContainer);
        console.log('已移除YouBike分析結果容器');
      }
      
      // 找到右側結果面板
      const resultDiv = document.getElementById('resultDiv');
      if (resultDiv) {
        // 移除所有YouBike相關的分析結果
        const youbikeResultSections = Array.from(resultDiv.querySelectorAll('.section-header')).filter(header => {
          return header.textContent && header.textContent.includes('YouBike');
        });
        
        youbikeResultSections.forEach(header => {
          if (header.nextElementSibling && header.parentElement) {
            header.parentElement.removeChild(header.nextElementSibling);
            header.parentElement.removeChild(header);
            console.log('已移除YouBike分析結果部分');
          }
        });
      }
      
      // 移除即時車位頁籤中的分析結果
      const youbikeTab = document.getElementById('youbike-tab');
      if (youbikeTab) {
        const analysisResults = youbikeTab.querySelector('.youbike-analysis-results');
        if (analysisResults && analysisResults.parentElement) {
          analysisResults.parentElement.removeChild(analysisResults);
          console.log('已移除即時車位頁籤中的分析結果');
        }
      }
    }
  
    // 3. 禁用分析相關的全局函數
    function disableAnalysisFunctions() {
      // 替換所有全局分析函數，使其無效
      const analysisFunctions = [
        'findNearestYouBikeStation', 
        'analyzeYouBikeCoverage', 
        'analyzeNewStationOpportunity',
        'togglePointMarking'
      ];
      
      analysisFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
          window[funcName] = function() {
            console.log(`YouBike分析功能已停用: ${funcName}`);
            return null;
          };
          console.log(`已禁用分析函數: ${funcName}`);
        }
      });
      
      // 禁用youbikeAnalysisVars全局變數
      if (window.youbikeAnalysisVars) {
        window.youbikeAnalysisVars = {
          disabled: true
        };
        console.log('已禁用分析全局變數');
      }
      
      // 禁用youbikeMarkerUtils全局變數
      if (window.youbikeMarkerUtils) {
        window.youbikeMarkerUtils = {
          disabled: true
        };
        console.log('已禁用標記工具全局變數');
      }
    }
  
    // 4. 移除分析圖層
    function removeAnalysisLayers() {
      if (!window.view || !window.view.map) return;
      
      // 分析相關的圖層ID
      const analysisLayerIds = [
        'youbikeMarkerLayer',
        'youbikeNearestLayer',
        'youbikeCoverageLayer',
        'youbikeOpportunityLayer',
        'youbikeHighlightLayer'
      ];
      
      // 移除所有分析圖層
      analysisLayerIds.forEach(layerId => {
        const layer = window.view.map.findLayerById(layerId);
        if (layer) {
          window.view.map.remove(layer);
          console.log(`已移除分析圖層: ${layerId}`);
        }
      });
    }
  })();