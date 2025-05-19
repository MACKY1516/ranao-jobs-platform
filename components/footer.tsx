import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 w-full">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-white">
              RANAO<span className="text-yellow-500">Jobs</span>
            </h3>
            <p className="mb-4 text-sm">
              Connecting talented professionals with their dream careers and helping employers find the perfect
              candidates.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="hover:text-yellow-500">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="hover:text-yellow-500">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="hover:text-yellow-500">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="hover:text-yellow-500">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>

          {/* For Job Seekers */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">For Job Seekers</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-yellow-500">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-yellow-500">
                  Career Resources
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-yellow-500">
                  Resume Builder
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-yellow-500">
                  Salary Calculator
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-yellow-500">
                  Job Alerts
                </Link>
              </li>
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">For Employers</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-yellow-500">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-yellow-500">
                  Browse Candidates
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-yellow-500">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-yellow-500">
                  Recruitment Solutions
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-yellow-500">
                  Employer Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-yellow-500">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-yellow-500">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-yellow-500">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-yellow-500">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-yellow-500">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm">&copy; {new Date().getFullYear()} RANAOJobs. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <Button variant="link" className="text-gray-400 hover:text-yellow-500 text-xs">
              Privacy Policy
            </Button>
            <Button variant="link" className="text-gray-400 hover:text-yellow-500 text-xs">
              Terms of Service
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}
