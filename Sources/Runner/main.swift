import AppKit
import Darwin

// MARK: - CPU Monitor

class CPUMonitor {
    private var prevCpuInfo: processor_info_array_t?
    private var numPrevCpuInfo: mach_msg_type_number_t = 0

    func currentUsage() -> Double {
        var numCPUs: natural_t = 0
        var cpuInfo: processor_info_array_t?
        var numCpuInfo: mach_msg_type_number_t = 0

        let result = host_processor_info(
            mach_host_self(),
            PROCESSOR_CPU_LOAD_INFO,
            &numCPUs,
            &cpuInfo,
            &numCpuInfo
        )

        guard result == KERN_SUCCESS, let cpuInfo = cpuInfo else {
            return 0.0
        }

        var totalUsage: Double = 0
        var totalTicks: Double = 0

        if let prevCpuInfo = prevCpuInfo {
            for i in 0..<Int(numCPUs) {
                let offset = Int32(i) * CPU_STATE_MAX
                let userDelta = Int64(cpuInfo[Int(offset + CPU_STATE_USER)]) - Int64(prevCpuInfo[Int(offset + CPU_STATE_USER)])
                let systemDelta = Int64(cpuInfo[Int(offset + CPU_STATE_SYSTEM)]) - Int64(prevCpuInfo[Int(offset + CPU_STATE_SYSTEM)])
                let idleDelta = Int64(cpuInfo[Int(offset + CPU_STATE_IDLE)]) - Int64(prevCpuInfo[Int(offset + CPU_STATE_IDLE)])
                let niceDelta = Int64(cpuInfo[Int(offset + CPU_STATE_NICE)]) - Int64(prevCpuInfo[Int(offset + CPU_STATE_NICE)])

                let used = Double(userDelta + systemDelta + niceDelta)
                let total = used + Double(idleDelta)
                totalUsage += used
                totalTicks += total
            }

            // Deallocate previous info
            let prevSize = vm_size_t(MemoryLayout<integer_t>.stride * Int(numPrevCpuInfo))
            vm_deallocate(mach_task_self_, vm_address_t(bitPattern: prevCpuInfo), prevSize)
        }

        prevCpuInfo = cpuInfo
        numPrevCpuInfo = numCpuInfo

        if totalTicks > 0 {
            return min(1.0, max(0.0, totalUsage / totalTicks))
        }
        return 0.0
    }
}

// MARK: - Animation Frames

let walkFrames = ["🚶", "🚶‍♂️"]
let runFrames  = ["🏃", "🏃‍♂️"]

// MARK: - App Delegate

class AppDelegate: NSObject, NSApplicationDelegate {
    private var statusItem: NSStatusItem!
    private var cpuMonitor = CPUMonitor()
    private var cpuMenuItem: NSMenuItem!

    private var animationTimer: Timer?
    private var cpuTimer: Timer?
    private var frameIndex = 0
    private var cpuLoad: Double = 0.0

    func applicationDidFinishLaunching(_ notification: Notification) {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        statusItem.button?.title = walkFrames[0]

        let menu = NSMenu()
        cpuMenuItem = NSMenuItem(title: "CPU: 0%", action: nil, keyEquivalent: "")
        cpuMenuItem.isEnabled = false
        menu.addItem(cpuMenuItem)
        menu.addItem(.separator())
        menu.addItem(NSMenuItem(title: "Quit ランナー", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
        statusItem.menu = menu

        // Initial CPU sample (first reading is always 0)
        _ = cpuMonitor.currentUsage()

        // CPU sampling timer - every 2 seconds
        cpuTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { [weak self] _ in
            self?.updateCPU()
        }

        // Start animation
        scheduleAnimationTimer()
    }

    private func updateCPU() {
        cpuLoad = cpuMonitor.currentUsage()
        let percentage = Int(cpuLoad * 100)
        cpuMenuItem.title = "CPU: \(percentage)%"
        scheduleAnimationTimer()
    }

    private func scheduleAnimationTimer() {
        animationTimer?.invalidate()
        // 0% -> 1.0s interval (slow walk), 100% -> 0.1s interval (fast run)
        let interval = 1.0 - (cpuLoad * 0.9)
        animationTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
            self?.advanceFrame()
        }
    }

    private func advanceFrame() {
        let frames = cpuLoad > 0.5 ? runFrames : walkFrames
        frameIndex = (frameIndex + 1) % frames.count
        statusItem.button?.title = frames[frameIndex]
    }
}

// MARK: - Entry Point

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.accessory)
app.run()
