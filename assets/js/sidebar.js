document.addEventListener("DOMContentLoaded", function () {
  scrollToActiveItem();
  enableCollapsibles();
});

/**
 * Attach click handlers to sidebar collapsible buttons to toggle their container's open state.
 *
 * Finds all elements with class "hextra-sidebar-collapsible-button" and adds a click listener
 * that prevents the default action and toggles the "open" class on the button's grandparent
 * element (button.parentElement.parentElement). If the grandparent element is not present,
 * no action is taken.
 */
function enableCollapsibles() {
  const buttons = document.querySelectorAll(".hextra-sidebar-collapsible-button");
  buttons.forEach(function (button) {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const list = button.parentElement.parentElement;
      if (list) {
        list.classList.toggle("open")
      }
    });
  });
}

/**
 * Scroll the sidebar's custom scrollbar so the first visible "active" item is revealed.
 *
 * Finds the first element matching `.hextra-sidebar-active-item` that has a visible height,
 * computes its vertical offset relative to the sidebar scrollbar (`aside.hextra-sidebar-container > .hextra-scrollbar`),
 * and scrolls the scrollbar so the item is brought into view.
 *
 * Notes:
 * - If no visible active item is found the function returns without scrolling.
 * - The function expects the DOM structure to contain `aside.hextra-sidebar-container > .hextra-scrollbar`
 *   and at least one `.hextra-sidebar-active-item`; missing elements will cause native DOM errors.
 */
function scrollToActiveItem() {
  const sidebarScrollbar = document.querySelector("aside.hextra-sidebar-container > .hextra-scrollbar");
  const activeItems = document.querySelectorAll(".hextra-sidebar-active-item");
  const visibleActiveItem = Array.from(activeItems).find(function (activeItem) {
    return activeItem.getBoundingClientRect().height > 0;
  });

  if (!visibleActiveItem) {
    return;
  }

  const yOffset = visibleActiveItem.clientHeight;
  const yDistance = visibleActiveItem.getBoundingClientRect().top - sidebarScrollbar.getBoundingClientRect().top;
  sidebarScrollbar.scrollTo({
    behavior: "instant",
    top: yDistance - yOffset
  });
}
