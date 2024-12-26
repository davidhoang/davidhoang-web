import { b as baseService } from './_astro_assets_B9IK3RLa.mjs';

function isESMImportedImage(src) {
    return typeof src === 'object';
}
const qualityTable = {
    low: 25,
    mid: 50,
    high: 80,
    max: 100,
};
function sharedValidateOptions(options, serviceConfig, mode) {
    const vercelImageOptions = serviceConfig;
    const configuredWidths = vercelImageOptions.sizes.sort((a, b) => a - b);
    // The logic for finding the perfect width is a bit confusing, here it goes:
    // For images where no width has been specified:
    // - For local, imported images, fallback to nearest width we can find in our configured
    // - For remote images, that's an error, width is always required.
    // For images where a width has been specified:
    // - If the width that the user asked for isn't in `sizes`, then fallback to the nearest one, but save the width
    // 	the user asked for so we can put it on the `img` tag later.
    // - Otherwise, just use as-is.
    // The end goal is:
    // - The size on the page is always the one the user asked for or the base image's size
    // - The actual size of the image file is always one of `sizes`, either the one the user asked for or the nearest to it
    if (!options.width) {
        const src = options.src;
        if (isESMImportedImage(src)) {
            const nearestWidth = configuredWidths.reduce((prev, curr) => {
                return Math.abs(curr - src.width) < Math.abs(prev - src.width) ? curr : prev;
            });
            // Use the image's base width to inform the `width` and `height` on the `img` tag
            options.inputtedWidth = src.width;
            options.width = nearestWidth;
        }
        else {
            throw new Error(`Missing \`width\` parameter for remote image ${options.src}`);
        }
    }
    else {
        if (!configuredWidths.includes(options.width)) {
            const nearestWidth = configuredWidths.reduce((prev, curr) => {
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                return Math.abs(curr - options.width) < Math.abs(prev - options.width) ? curr : prev;
            });
            // Save the width the user asked for to inform the `width` and `height` on the `img` tag
            options.inputtedWidth = options.width;
            options.width = nearestWidth;
        }
    }
    if (options.quality && typeof options.quality === 'string') {
        options.quality = options.quality in qualityTable ? qualityTable[options.quality] : undefined;
    }
    if (!options.quality) {
        options.quality = 100;
    }
    return options;
}

const service = {
    ...baseService,
    validateOptions: (options, serviceOptions) => sharedValidateOptions(options, serviceOptions.service.config),
    getHTMLAttributes(options) {
        const { inputtedWidth, ...props } = options;
        // If `validateOptions` returned a different width than the one of the image, use it for attributes
        if (inputtedWidth) {
            props.width = inputtedWidth;
        }
        let targetWidth = props.width;
        let targetHeight = props.height;
        if (isESMImportedImage(props.src)) {
            const aspectRatio = props.src.width / props.src.height;
            if (targetHeight && !targetWidth) {
                // If we have a height but no width, use height to calculate the width
                targetWidth = Math.round(targetHeight * aspectRatio);
            }
            else if (targetWidth && !targetHeight) {
                // If we have a width but no height, use width to calculate the height
                targetHeight = Math.round(targetWidth / aspectRatio);
            }
            else if (!targetWidth && !targetHeight) {
                // If we have neither width or height, use the original image's dimensions
                targetWidth = props.src.width;
                targetHeight = props.src.height;
            }
        }
        const { src, width, height, format, quality, densities, widths, formats, ...attributes } = options;
        return {
            ...attributes,
            width: targetWidth,
            height: targetHeight,
            loading: attributes.loading ?? 'lazy',
            decoding: attributes.decoding ?? 'async',
        };
    },
    getURL(options) {
        const fileSrc = isESMImportedImage(options.src)
            ? removeLeadingForwardSlash(options.src.src)
            : options.src;
        const searchParams = new URLSearchParams();
        searchParams.append('url', fileSrc);
        options.width && searchParams.append('w', options.width.toString());
        options.quality && searchParams.append('q', options.quality.toString());
        // biome-ignore lint/style/useTemplate: <explanation>
        return '/_vercel/image?' + searchParams;
    },
};
function removeLeadingForwardSlash(path) {
    return path.startsWith('/') ? path.substring(1) : path;
}

export { service as default };
