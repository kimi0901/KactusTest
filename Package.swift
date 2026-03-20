// swift-tools-version: 5.7

import PackageDescription

let package = Package(
    name: "Runner",
    platforms: [.macOS(.v12)],
    targets: [
        .executableTarget(name: "Runner", path: "Sources/Runner")
    ]
)
