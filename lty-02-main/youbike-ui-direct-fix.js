/**
 * 修正版 - YouBike界面修改
 * 1. 移除新增站點可行性分析功能
 * 2. 交換按鈕位置
 * 3. 修改標記按鈕樣式
 * 4. 移動圖層控制
 */

(function() {
    // 建立全局變數追蹤修改狀態
    window.youbikeUIFixed = {
      opportunityRemoved: false,
      buttonsSwapped: false,
      layerToggleMoved: false,
      completed: false
    };
    
    // 主函數 - 僅執行一次
    function fixYoubikeUI() {
      console.log('開始修正YouBike界面');
      
      // 執行一次性修改
      tryRemoveOpportunity();
      trySwapButtons();
      tryMoveLayerToggle();
      
      // 設置重試計時器
      const fixInterval = setInterval(function() {
        // 檢查所有修改是否已完成
        if (window.youbikeUIFixed.opportunityRemoved && 
            window.youbikeUIFixed.buttonsSwapped && 
            window.youbikeUIFixed.layerToggleMoved) {
          window.youbikeUIFixed.completed = true;
          clearInterval(fixInterval);
          console.log('YouBike界面修改完成');
          return;
        }
        
        // 嘗試尚未完成的修改
        if (!window.youbikeUIFixed.opportunityRemoved) {
          tryRemoveOpportunity();
        }
        
        if (!window.youbikeUIFixed.buttonsSwapped) {
          trySwapButtons();
        }
        
        if (!window.youbikeUIFixed.layerToggleMoved) {
          tryMoveLayerToggle();
        }
      }, 2000);
      
      // 30秒後無論如何都停止嘗試
      setTimeout(function() {
        clearInterval(fixInterval);
        console.log('YouBike界面修改超時，已停止');
      }, 30000);
    }
    
    // 1. 嘗試移除新增站點可行性分析選項
    function tryRemoveOpportunity() {
      try {
        const select = document.getElementById('youbikeAnalysisType');
        if (select && select.options) {
          for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === 'opportunity') {
              select.remove(i);
              window.youbikeUIFixed.opportunityRemoved = true;
              console.log('已移除「分析新增站點可行性」選項');
              return;
            }
          }
        }
      } catch (e) {
        console.error('移除站點可行性分析選項時出錯:', e);
      }
    }
    
    // 2 & 3. 嘗試交換按鈕位置並修改標記按鈕樣式
    function trySwapButtons() {
      try {
        const markBtn = document.getElementById('markPointForAnalysis');
        const runBtn = document.getElementById('runYouBikeAnalysis');
        
        if (markBtn && runBtn && markBtn.parentElement === runBtn.parentElement) {
          const parent = markBtn.parentElement;
          
          // 檢查是否已經交換過
          if (parent.querySelector('#swap-marker')) {
            window.youbikeUIFixed.buttonsSwapped = true;
            return;
          }
          
          // 標記這次交換操作
          const marker = document.createElement('div');
          marker.id = 'swap-marker';
          marker.style.display = 'none';
          parent.appendChild(marker);
          
          // 創建新的容器
          const container = document.createElement('div');
          container.className = 'youbike-buttons-container';
          
          // 使用克隆確保事件被保留
          const newMarkBtn = markBtn.cloneNode(true);
          const newRunBtn = runBtn.cloneNode(true);
          
          // 修改標記按鈕樣式為白底黑字
          newMarkBtn.style.backgroundColor = 'white';
          newMarkBtn.style.color = 'black';
          newMarkBtn.style.border = '1px solid #ccc';
          
          // 添加按鈕到容器，先標記後執行
          container.appendChild(newMarkBtn);
          container.appendChild(newRunBtn);
          
          // 移除原有按鈕
          parent.removeChild(markBtn);
          parent.removeChild(runBtn);
          
          // 添加新容器到父元素
          parent.appendChild(container);
          
          // 確保事件正確設置
          newMarkBtn.onclick = function() {
            if (window.youbikeMarkerUtils && typeof window.youbikeMarkerUtils.togglePointMarking === 'function') {
              window.youbikeMarkerUtils.togglePointMarking();
            }
          };
          
          newRunBtn.onclick = function() {
            const analysisType = document.getElementById('youbikeAnalysisType');
            const type = analysisType ? analysisType.value : 'nearest';
            
            if (type === 'nearest' && typeof window.findNearestYouBikeStation === 'function') {
              window.findNearestYouBikeStation();
            } else if (type === 'coverage' && typeof window.analyzeYouBikeCoverage === 'function') {
              window.analyzeYouBikeCoverage();
            }
          };
          
          window.youbikeUIFixed.buttonsSwapped = true;
          console.log('已交換按鈕位置並修改樣式');
        }
      } catch (e) {
        console.error('交換按鈕時出錯:', e);
      }
    }
    
    // 4. 嘗試移動圖層開關
    function tryMoveLayerToggle() {
      try {
        // 檢查是否已經移動過
        if (document.getElementById('youbike-layer-control-moved')) {
          window.youbikeUIFixed.layerToggleMoved = true;
          return;
        }
        
        // 尋找圖層開關
        const layerToggle = document.getElementById('youbikeLayerToggle');
        if (!layerToggle) return;
        
        // 尋找或創建左側控制容器
        let leftControls = document.getElementById('left-controls');
        if (!leftControls) {
          leftControls = document.createElement('div');
          leftControls.id = 'left-controls';
          leftControls.style.position = 'absolute';
          leftControls.style.left = '20px';
          leftControls.style.bottom = '350px';
          leftControls.style.zIndex = '1000';
          leftControls.style.backgroundColor = 'white';
          leftControls.style.padding = '10px';
          leftControls.style.borderRadius = '4px';
          leftControls.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          
          const viewDiv = document.getElementById('viewDiv');
          if (viewDiv) {
            viewDiv.appendChild(leftControls);
          }
        }
        
        // 創建標記元素防止重複執行
        const marker = document.createElement('div');
        marker.id = 'youbike-layer-control-moved';
        marker.style.display = 'none';
        leftControls.appendChild(marker);
        
        // 創建新的開關
        const newToggle = document.createElement('div');
        newToggle.innerHTML = `
          <div style="margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
            <label style="margin-right: 10px;">YouBike 站點圖層</label>
            <label class="switch" style="position: relative; display: inline-block; width: 40px; height: 20px;">
              <input type="checkbox" id="youbikeLayerToggleNew" checked>
              <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px;"></span>
            </label>
          </div>
        `;
        
        // 添加到左側控制區
        leftControls.insertBefore(newToggle, leftControls.firstChild);
        
        // 獲取新建的開關
        const newLayerToggle = document.getElementById('youbikeLayerToggleNew');
        if (newLayerToggle) {
          // 同步開關狀態
          newLayerToggle.checked = layerToggle.checked;
          
          // 添加事件監聽
          newLayerToggle.addEventListener('change', function(e) {
            layerToggle.checked = e.target.checked;
            
            // 觸發原始開關的change事件
            const event = new Event('change');
            layerToggle.dispatchEvent(event);
          });
          
          window.youbikeUIFixed.layerToggleMoved = true;
          console.log('已移動圖層開關到左側');
        }
      } catch (e) {
        console.error('移動圖層開關時出錯:', e);
      }
    }
    
    // 等待DOM加載完成後執行
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fixYoubikeUI);
    } else {
      // 如果DOM已經加載完成，直接執行
      fixYoubikeUI();
    }
  })();