(() =>
{
    const loadPlayers = () =>
    {
        document.body.querySelectorAll("div[data-castpath]").forEach((div) =>
        {
            var path = div.dataset["castpath"];
            AsciinemaPlayer.create(path, div.firstChild);
        });
    };

    var observer = new MutationObserver(loadPlayers);

    document.addEventListener("DOMContentLoaded", () =>
    {
        observer.observe(
            document.querySelector(".document-container").parentNode,
            {
                childList: true,
                subtree: false
            })

        loadPlayers();
    });
})();