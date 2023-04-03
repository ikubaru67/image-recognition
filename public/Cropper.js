import React, { useState } from "react";
import ReactCrop from "react-image-crop";
import 'react-image-crop/dist/ReactCrop.css';

const [crop, setCrop] = useState ({ aspect: 2 / 1 });
const [result, setResult] = useState(null);

function getCroppedImage() {
    const canvas = document.createElement('canvas');
    const scaleX = images.naturalWidth / images.width;
    const scaleY = images.naturalHeight / images.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d')

    ctx.drawImage(
        images,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height,
    );

    const base64Image = canvas.toDataURL('image/jpeg');
    setResult(base64Image)

}