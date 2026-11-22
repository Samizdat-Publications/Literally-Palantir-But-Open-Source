#!/bin/sh
# encode.sh: join the three 120-frame shots with hard cuts into film.mp4 (30 fps, 12 s) + poster.png
set -e
cd "${1:-.}"  # run from the frames folder: sh encode.sh <outDir>
rm -rf seq; mkdir seq
i=0
for s in A-midtown B-swarm C-london-modes; do
  for f in final/$s/f*.png; do cp "$f" "seq/$(printf %04d $i).png"; i=$((i+1)); done
done
echo "frames: $i"
# two-pass at a 30 Mbps average keeps the 12 s film under GitHub's 50 MB limit (CRF 18 was 112 MB)
for pass in 1 2; do
  out=film.mp4; [ $pass = 1 ] && out="-f mp4 NUL"
  ffmpeg -v error -y -framerate 30 -i seq/%04d.png -c:v libx264 -preset slower -b:v 30M -maxrate 45M -bufsize 60M     -pass $pass -passlogfile x264pass -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709     -vf "scale=out_color_matrix=bt709:out_range=tv" -movflags +faststart $out
done
cp final/A-midtown/f0000.png poster.png
ffprobe -v error -show_entries stream=width,height,r_frame_rate,nb_frames -show_entries format=duration,size -of compact film.mp4
# review: contact sheet (every 20th frame), and 1.2:1 / 2:1 centre crops of 6 frames
ffmpeg -v error -y -framerate 1 -i seq/%04d.png -vf "select='not(mod(n\,20))',scale=480:-2,tile=6x3:padding=4" -frames:v 1 review-sheet.png
ffmpeg -v error -y -framerate 1 -i seq/%04d.png -vf "select='eq(n\,0)+eq(n\,100)+eq(n\,140)+eq(n\,230)+eq(n\,275)+eq(n\,350)',crop=1728:1440,scale=360:-2,tile=6x1:padding=4" -frames:v 1 review-12.png
ffmpeg -v error -y -framerate 1 -i seq/%04d.png -vf "select='eq(n\,0)+eq(n\,100)+eq(n\,140)+eq(n\,230)+eq(n\,275)+eq(n\,350)',crop=2560:1280,scale=200:-2,tile=6x1:padding=4" -frames:v 1 review-21.png
echo encoded
