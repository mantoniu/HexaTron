export const POSITION = {
    "top": {
        "#tooltip": {
            "bottom": (spacing) => `calc(100% + ${spacing}px)`,
            "left": () => `50%`,
            "transform": () => `translateX(-50%)`
        },
        "#tooltip::before": {
            "border-top": () => "15px solid var(--tooltip-color)",
            "border-left": () => "15px solid transparent",
            "border-right": () => "15px solid transparent",
            "top": () => "100%",
            "left": () => "45%"

        }
    },
    "bottom-left": {
        "#tooltip": {
            "top": (spacing) => `calc(100% + ${spacing}px)`,
            "right": (spacing) => `calc(30% + ${spacing}px)`
        },
        "#tooltip::before": {
            "border-bottom": () => "15px solid var(--tooltip-color)",
            "border-left": () => "15px solid transparent",
            "bottom": () => "100%",
            "right": () => "10%"
        }
    }
};