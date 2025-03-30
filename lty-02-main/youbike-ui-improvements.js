/**
 * YouBike界面優化
 * 1. 移除新增站點可行性分析
 * 2. 將查詢最近車位的結果呈現在「即時車位」頁籤中
 * 3. 交換執行分析和標記分析點位按鈕的位置
 * 4. 將車位資訊從公民建議頁籤移除
 */

(function() {
  // 初始化全局變數
  if (typeof window.youbikeUIUtils === 'undefined') {
    window.youbikeUIUtils = {
      initialized: false
    };
  }

  // 當頁面完全載入後執行初始化
  window.addEventListener('load', function() {
    console.log('YouBike界面優化: 頁面載入完成，開始初始化');
    
    // 多次嘗試初始化，確保DOM元素都已加載
    setTimeout(initUIImprovements, 1000);
    setTimeout(initUIImprovements, 3000);
    setTimeout(initUIImprovements, 5000);
    
    // 使用MutationObserver持續監視DOM變化
    observeDOM();
  });

  // 監視DOM變化
  function observeDOM() {
    const observer = new MutationObserver(function(mutations) {
      if (!window.youbikeUIUtils.initialized) {
        initUIImprovements();
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // 界面優化主函數
  function initUIImprovements() {
    // 避免重複初始化
    if (window.youbikeUIUtils.initialized) {
      return;
    }
    
    // 1. 移除新增站點可行性分析選項
    removeOpportunityAnalysis();
    
    // 2. 修改結果顯示位置
    modifyResultsDisplay();
    
    // 3. 交換按鈕位置
    swapButtonsPosition();
    
    // 4. 從公民建議頁籤移除車位資訊
    removeFromSuggestionTab();
    
    // 標記為已初始化
    window.youbikeUIUtils.initialized = true;
    console.log('YouBike界面優化完成');
  }

  // 1. 移除新增站點可行性分析選項
  function removeOpportunityAnalysis() {
    const analysisTypeSelect = document.getElementById('youbikeAnalysisType');
    if (analysisTypeSelect) {
      // 找到並移除「分析新增站點可行性」選項
      for (let i = 0; i < analysisTypeSelect.options.length; i++) {
        if (analysisTypeSelect.options[i].value === 'opportunity') {
          analysisTypeSelect.remove(i);
          console.log('已移除「分析新增站點可行性」選項');
          break;
        }
      }
    }
  }

  // 2. 修改結果顯示位置，將結果顯示在「即時車位」頁籤中
  function modifyResultsDisplay() {
    // 尋找執行分析按鈕，並修改其事件處理
    const runAnalysisBtn = document.getElementById('runYouBikeAnalysis');
    if (runAnalysisBtn && !runAnalysisBtn._modified) {
      // 保存原始事件
      const originalClick = runAnalysisBtn.onclick;
      
      // 設置新的事件處理
      runAnalysisBtn.onclick = function(event) {
        // 調用原始事件處理
        if (typeof originalClick === 'function') {
          originalClick.call(this, event);
        }
        
        // 延遲執行，確保分析結果已生成
        setTimeout(() => {
          // 獲取分析結果
          const resultsContainer = document.getElementById('youbikeAnalysisResults');
          if (!resultsContainer) return;
          
          // 獲取車位查詢頁籤
          const youbikeTab = document.getElementById('youbike-tab');
          if (!youbikeTab) return;
          
          // 將分析結果添加到車位查詢頁籤中
          // 首先檢查是否已有結果容器
          let youbikeResultsContainer = youbikeTab.querySelector('.youbike-analysis-results');
          if (!youbikeResultsContainer) {
            youbikeResultsContainer = document.createElement('div');
            youbikeResultsContainer.className = 'youbike-analysis-results';
            youbikeResultsContainer.style.marginTop = '20px';
            youbikeResultsContainer.style.borderTop = '1px solid #ddd';
            youbikeResultsContainer.style.paddingTop = '15px';
            youbikeTab.querySelector('.widget-container').appendChild(youbikeResultsContainer);
          }
          
          // 複製分析結果到車位查詢頁籤
          youbikeResultsContainer.innerHTML = resultsContainer.innerHTML;
          
          // 自動切換到車位查詢頁籤
          const tabButtons = document.querySelectorAll('.tabButton');
          tabButtons.forEach(button => {
            if (button.textContent === '車位查詢') {
              button.click();
            }
          });
          
          console.log('已將分析結果顯示在「即時車位」頁籤中');
        }, 500);
      };
      
      // 標記為已修改
      runAnalysisBtn._modified = true;
    }
  }

  // 3. 交換「執行分析」和「標記分析點位」按鈕的位置
  function swapButtonsPosition() {
    // 等待按鈕都已加載
    const markPointBtn = document.getElementById('markPointForAnalysis');
    const runAnalysisBtn = document.getElementById('runYouBikeAnalysis');
    
    if (markPointBtn && runAnalysisBtn && !markPointBtn._swapped) {
      const parentElement = markPointBtn.parentElement;
      
      // 創建一個新的容器來控制按鈕順序
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'youbike-buttons-container';
      
      // 按照新順序添加按鈕到容器中（標記按鈕在上，執行分析按鈕在下）
      buttonContainer.appendChild(markPointBtn.cloneNode(true));
      buttonContainer.appendChild(runAnalysisBtn.cloneNode(true));
      
      // 移除原始按鈕
      if (parentElement) {
        parentElement.removeChild(markPointBtn);
        parentElement.removeChild(runAnalysisBtn);
        
        // 添加新容器到父元素
        parentElement.appendChild(buttonContainer);
        
        // 重新綁定事件
        buttonContainer.querySelector('#markPointForAnalysis').onclick = markPointBtn.onclick;
        buttonContainer.querySelector('#runYouBikeAnalysis').onclick = runAnalysisBtn.onclick;
        
        // 標記為已交換
        buttonContainer.querySelector('#markPointForAnalysis')._swapped = true;
        
        console.log('已交換按鈕位置');
      }
    }
  }

  // 4. 從公民建議頁籤移除車位資訊
  function removeFromSuggestionTab() {
    // 尋找公民建議頁籤
    const suggestionTab = document.getElementById('suggestion-tab');
    if (suggestionTab) {
      // 尋找並移除車位資訊相關元素
      const youbikeElements = suggestionTab.querySelectorAll('[id^="youbike"]');
      youbikeElements.forEach(element => {
        element.remove();
      });
      
      console.log('已從公民建議頁籤移除車位資訊');
    }
  }
  

})();