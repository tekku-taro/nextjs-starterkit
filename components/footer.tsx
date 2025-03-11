import { BRAND_NAME } from "@/lib/constants";

const Footer = () => {
  return ( 
    <footer className="border-t py-4 mt-auto">
      <div className="container mx-auto">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
        </p>
      </div>
    </footer>  
  );
}
 
export default Footer;