import React from 'react';
import { Box, Avatar, Popover } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

export interface ImagePreviewAvatarProps {
    /** Image URL to display. When falsy, only fallbackContent is shown (no popover). */
    imageUrl?: string | null;
    /** Alt text for the image */
    alt: string;
    /** Optional click handler (e.g. navigate to detail) */
    onClick?: () => void;
    /** Content when no image (e.g. first letter). Renders inside Avatar. */
    fallbackContent?: React.ReactNode;
    /** Avatar size in pixels */
    size?: number;
    /** Additional sx for the Avatar */
    avatarSx?: SxProps<Theme>;
    /** Delay in ms before closing popover on mouse leave */
    closeDelayMs?: number;
    /** Additional sx for the popover paper */
    popoverPaperSx?: SxProps<Theme>;
}

/**
 * Reusable avatar with hover image preview popover.
 * Use in list tables for product, brand, category, sub-category images.
 */
export default function ImagePreviewAvatar({
    imageUrl,
    alt,
    onClick,
    fallbackContent,
    size = 50,
    avatarSx,
    closeDelayMs = 150,
    popoverPaperSx,
}: ImagePreviewAvatarProps) {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
    const closeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearCloseTimeout = React.useCallback(() => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
    }, []);

    const handleMouseEnter = React.useCallback(
        (e: React.MouseEvent<HTMLElement>) => {
            clearCloseTimeout();
            if (imageUrl) setAnchorEl(e.currentTarget);
        },
        [imageUrl, clearCloseTimeout]
    );

    const handleMouseLeave = React.useCallback(() => {
        closeTimeoutRef.current = setTimeout(() => setAnchorEl(null), closeDelayMs);
    }, [closeDelayMs]);

    const handlePopoverMouseEnter = React.useCallback(() => {
        clearCloseTimeout();
    }, [clearCloseTimeout]);

    const handlePopoverMouseLeave = React.useCallback(() => {
        setAnchorEl(null);
    }, []);

    React.useEffect(() => () => clearCloseTimeout(), [clearCloseTimeout]);

    const hasImage = Boolean(imageUrl);

    return (
        <Box
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            sx={{ display: 'inline-flex' }}
        >
            <Avatar
                src={hasImage ? imageUrl! : undefined}
                alt={alt}
                variant="rounded"
                onClick={onClick}
                sx={{
                    width: size,
                    height: size,
                    py: 1,
                    cursor: onClick ? 'pointer' : 'default',
                    ...(avatarSx as object),
                }}
            >
                {!hasImage && fallbackContent}
            </Avatar>
            {hasImage && (
                <Popover
                    open={Boolean(anchorEl)}
                    anchorEl={anchorEl}
                    onClose={() => setAnchorEl(null)}
                    anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'center', horizontal: 'left' }}
                    disableRestoreFocus
                    slotProps={{
                        root: { sx: { pointerEvents: 'none' } },
                    }}
                    PaperProps={{
                        onMouseEnter: handlePopoverMouseEnter,
                        onMouseLeave: handlePopoverMouseLeave,
                        sx: {
                            pointerEvents: 'auto',
                            minWidth: 200,
                            maxWidth: 280,
                            p: 2,
                            borderRadius: 2,
                            boxShadow: 3,
                            ml: 0.5,
                            ...(popoverPaperSx as object),
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box
                            component="img"
                            src={imageUrl!}
                            alt={alt}
                            sx={{
                                width: '100%',
                                maxHeight: 200,
                                objectFit: 'contain',
                                borderRadius: 1,
                            }}
                        />
                    </Box>
                </Popover>
            )}
        </Box>
    );
}
