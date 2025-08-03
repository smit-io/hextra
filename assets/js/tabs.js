(function () {
  function updateGroup(container, index) {
    const tabs = Array.from(container.querySelectorAll('.hextra-tabs-toggle'));
    tabs.forEach((tab, i) => {
      tab.dataset.state = i === index ? 'selected' : '';
      if (i === index) {
        tab.setAttribute('aria-selected', 'true');
        tab.tabIndex = 0;
      } else {
        tab.removeAttribute('aria-selected');
        tab.removeAttribute('tabindex');
      }
    });
    const panelsContainer = container.parentElement.nextElementSibling;
    if (!panelsContainer) return;
    Array.from(panelsContainer.children).forEach((panel, i) => {
      panel.dataset.state = i === index ? 'selected' : '';
      if (i === index) {
        panel.tabIndex = 0;
      } else {
        panel.removeAttribute('tabindex');
      }
    });
  }

  // Handle synced tabs (with data-tab-group)
  const syncedGroups = document.querySelectorAll('[data-tab-group]');
  syncedGroups.forEach((group) => {
    const key = encodeURIComponent(group.dataset.tabGroup);
    const saved = localStorage.getItem('hextra-tab-' + key);
    if (saved !== null) {
      updateGroup(group, parseInt(saved, 10));
    }
  });

  // Handle all tab toggles (both synced and non-synced)
  document.querySelectorAll('.hextra-tabs-toggle').forEach((button) => {
    button.addEventListener('click', function (e) {
      const container = e.target.parentElement;
      const index = Array.from(container.querySelectorAll('.hextra-tabs-toggle')).indexOf(
        e.target
      );
      
      // Check if this is a synced tab group
      if (container.dataset.tabGroup) {
        const key = encodeURIComponent(container.dataset.tabGroup);
        // Sync all tabs with the same group name
        document
          .querySelectorAll('[data-tab-group="' + container.dataset.tabGroup + '"]')
          .forEach((grp) => updateGroup(grp, index));
        // Save to localStorage
        localStorage.setItem('hextra-tab-' + key, index.toString());
      } else {
        // Handle individual tab group (no sync)
        updateGroup(container, index);
      }
    });
  });
})();
