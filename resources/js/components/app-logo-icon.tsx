import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    const { className, ...rest } = props;
    return (
        <img 
            src="/images/parcel-logo.png" 
            alt="InstaStation Logo" 
            className={className}
            {...rest}
        />
    );
}
