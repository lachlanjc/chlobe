import AVFoundation
import CoreGraphics
import CoreVideo
import Foundation
import ImageIO

let framesDirectory = CommandLine.arguments[1]
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
let width = 1200
let height = 630
let framesPerSecond: Int32 = 30

let frames = try FileManager.default.contentsOfDirectory(atPath: framesDirectory)
  .filter { $0.hasPrefix("frame-") && $0.hasSuffix(".png") }
  .sorted()
guard frames.count == 180 else {
  fatalError("Expected 180 captured frames, found \(frames.count)")
}

try? FileManager.default.removeItem(at: outputURL)
let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true
let videoInput = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264,
  AVVideoWidthKey: width,
  AVVideoHeightKey: height,
  AVVideoCompressionPropertiesKey: [
    AVVideoAverageBitRateKey: 4_000_000,
    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
  ],
])
videoInput.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: videoInput, sourcePixelBufferAttributes: [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
  kCVPixelBufferWidthKey as String: width,
  kCVPixelBufferHeightKey as String: height,
  kCVPixelBufferCGImageCompatibilityKey as String: true,
  kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
])
writer.add(videoInput)
guard writer.startWriting() else {
  fatalError(writer.error?.localizedDescription ?? "Could not start video writer")
}
writer.startSession(atSourceTime: .zero)

for (index, name) in frames.enumerated() {
  while !videoInput.isReadyForMoreMediaData {
    Thread.sleep(forTimeInterval: 0.01)
  }
  let url = URL(fileURLWithPath: framesDirectory).appendingPathComponent(name)
  guard
    let source = CGImageSourceCreateWithURL(url as CFURL, nil),
    let image = CGImageSourceCreateImageAtIndex(source, 0, nil),
    image.width == width,
    image.height == height,
    let pool = adaptor.pixelBufferPool
  else {
    fatalError("Could not read frame \(name)")
  }
  var pixelBuffer: CVPixelBuffer?
  let status = CVPixelBufferPoolCreatePixelBuffer(kCFAllocatorDefault, pool, &pixelBuffer)
  guard status == kCVReturnSuccess, let pixelBuffer else {
    fatalError("Could not allocate pixel buffer for \(name)")
  }
  CVPixelBufferLockBaseAddress(pixelBuffer, [])
  let bitmapInfo = CGBitmapInfo.byteOrder32Little.rawValue
    | CGImageAlphaInfo.premultipliedFirst.rawValue
  guard let context = CGContext(
    data: CVPixelBufferGetBaseAddress(pixelBuffer),
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer),
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: bitmapInfo
  ) else {
    fatalError("Could not draw frame \(name)")
  }
  context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
  CVPixelBufferUnlockBaseAddress(pixelBuffer, [])
  let time = CMTime(value: Int64(index), timescale: framesPerSecond)
  guard adaptor.append(pixelBuffer, withPresentationTime: time) else {
    fatalError(writer.error?.localizedDescription ?? "Could not append frame \(name)")
  }
}

videoInput.markAsFinished()
let finished = DispatchSemaphore(value: 0)
writer.finishWriting { finished.signal() }
finished.wait()
guard writer.status == .completed else {
  fatalError(writer.error?.localizedDescription ?? "Video encoding failed")
}

let outputDirectory = outputURL.deletingLastPathComponent()
let sidecars = try FileManager.default.contentsOfDirectory(
  at: outputDirectory,
  includingPropertiesForKeys: nil
).filter { $0.lastPathComponent.hasPrefix("\(outputURL.lastPathComponent).sb-") }
for sidecar in sidecars {
  try FileManager.default.removeItem(at: sidecar)
}
