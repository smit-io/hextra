document.addEventListener("DOMContentLoaded", () => {
  // Pre-fetch markdown content for all copy buttons to avoid Safari NotAllowedError
  // Safari requires clipboard writes to happen synchronously within user gesture
  const copyButtons = document.querySelectorAll(".hextra-page-context-menu-copy");
  const contentCache = new Map();

  // Pre-fetch content for each button on page load
  copyButtons.forEach((button) => {
    const url = button.dataset.url;
    if (url) {
      fetch(url)
        .then((response) => {
          if (response.ok) return response.text();
          throw new Error("Failed to fetch");
        })
        .then((markdown) => contentCache.set(url, markdown))
        .catch((error) => console.error("Failed to pre-fetch markdown:", error));
    }
  });

  // Initialize copy buttons with synchronous clipboard access
  copyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const url = button.dataset.url;
      const markdown = contentCache.get(url);

      if (markdown) {
        // Synchronous clipboard write initiation - works in Safari
        navigator.clipboard
          .writeText(markdown)
          .then(() => {
            button.classList.add("copied");
            setTimeout(() => button.classList.remove("copied"), 1000);
          })
          .catch((error) => console.error("Failed to copy markdown:", error));
      } else {
        // Fallback: fetch and copy (may fail in Safari if content not pre-fetched)
        fetch(url)
          .then((response) => {
            if (!response.ok) throw new Error("Failed to fetch");
            return response.text();
          })
          .then((text) => {
            contentCache.set(url, text);
            return navigator.clipboard.writeText(text);
          })
          .then(() => {
            button.classList.add("copied");
            setTimeout(() => button.classList.remove("copied"), 1000);
          })
          .catch((error) => console.error("Failed to copy markdown:", error));
      }
    });
  });

  // Dropdown open/close plus keyboard navigation. This is a role="menu"
  // widget, so a screen reader switches to application mode on entry and hands
  // the arrow keys to the widget rather than scrolling the page - a menu that
  // ignores them strands anything below the fold of its own scroll container.
  // The behaviour mirrors assets/js/core/nav-menu.js so the theme's menus are
  // consistent.
  const hiddenClass = "hx:hidden";
  const dropdownToggles = document.querySelectorAll(".hextra-page-context-menu-toggle");

  const closeDropdown = (container, focusToggle = false) => {
    if (!container) return;

    const toggle = container.querySelector(".hextra-page-context-menu-toggle");
    const menu = container.querySelector(".hextra-page-context-menu-dropdown");

    if (!toggle || !menu) return;

    const chevron = toggle.querySelector("[data-chevron]");
    toggle.dataset.state = "closed";
    toggle.setAttribute("aria-expanded", "false");
    menu.classList.add(hiddenClass);
    if (chevron) {
      chevron.style.transform = "";
    }
    if (focusToggle) {
      toggle.focus();
    }
  };

  const openDropdown = (toggle, focusTarget = "none") => {
    const container = toggle.closest(".hextra-page-context-menu");
    const menu = container && container.querySelector(".hextra-page-context-menu-dropdown");

    if (!menu) return;

    // Close all other dropdowns first.
    dropdownToggles.forEach((other) => {
      if (other !== toggle) {
        closeDropdown(other.closest(".hextra-page-context-menu"));
      }
    });

    const chevron = toggle.querySelector("[data-chevron]");
    toggle.dataset.state = "open";
    toggle.setAttribute("aria-expanded", "true");
    menu.classList.remove(hiddenClass);
    if (chevron) {
      chevron.style.transform = "rotate(180deg)";
    }

    if (focusTarget !== "none") {
      const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
      if (items.length > 0) {
        const target = focusTarget === "last" ? items[items.length - 1] : items[0];
        target.focus();
      }
    }
  };

  dropdownToggles.forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const container = toggle.closest(".hextra-page-context-menu");
      if (toggle.dataset.state === "open") {
        closeDropdown(container);
      } else {
        openDropdown(toggle);
      }
    });

    toggle.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        openDropdown(toggle, "first");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        openDropdown(toggle, "last");
      }
    });
  });

  document.querySelectorAll(".hextra-page-context-menu-dropdown[role=menu]").forEach((menu) => {
    menu.addEventListener("keydown", (e) => {
      const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
      if (items.length === 0) return;

      // -1 when focus is still on the toggle, which is why the wrap-around is
      // not a plain modulo: ArrowUp from there has to reach the last item.
      const currentIndex = items.indexOf(document.activeElement);

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          items[currentIndex === -1 ? 0 : (currentIndex + 1) % items.length].focus();
          break;
        case "ArrowUp":
          e.preventDefault();
          items[currentIndex === -1 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length].focus();
          break;
        case "Home":
          e.preventDefault();
          items[0].focus();
          break;
        case "End":
          e.preventDefault();
          items[items.length - 1].focus();
          break;
        case "Escape":
          e.preventDefault();
          closeDropdown(menu.closest(".hextra-page-context-menu"), true);
          break;
      }
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    // Check if click is outside any dropdown container
    const isOutside = !e.target.closest(".hextra-page-context-menu");
    if (isOutside) {
      dropdownToggles.forEach((toggle) => {
        closeDropdown(toggle.closest(".hextra-page-context-menu"));
      });
    }
  });

  // Close dropdown on Escape key and return focus to toggle
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dropdownToggles.forEach((toggle) => {
        if (toggle.dataset.state === "open") {
          closeDropdown(toggle.closest(".hextra-page-context-menu"), true);
        }
      });
    }
  });

  // Handle dropdown menu copy action
  document.querySelectorAll('.hextra-page-context-menu-dropdown button[data-action="copy"]').forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const container = btn.closest(".hextra-page-context-menu");
      if (!container) return;

      const copyBtn = container.querySelector(".hextra-page-context-menu-copy");
      if (!copyBtn) return;

      closeDropdown(container);
      copyBtn.click();
    });
  });

  // Handle dropdown menu view action
  document.querySelectorAll('.hextra-page-context-menu-dropdown button[data-action="view"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const container = btn.closest(".hextra-page-context-menu");
      if (!container) return;

      const url = btn.dataset.url;
      if (!url) return;

      closeDropdown(container);
      window.open(url, "_blank", "noopener,noreferrer");
    });
  });
});
