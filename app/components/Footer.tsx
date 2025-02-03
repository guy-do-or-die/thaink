import Links from '@/components/Links'

const Base = () => {
  return <div className="base-logo">
    <svg height="20" viewBox="0 0 416 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M110.034 55C110.034 85.3756 85.359 110 54.921 110C26.0432 110 2.35281 87.8354 0 59.6232H72.8467V50.3768H0C2.35281 22.1646 26.0432 0 54.921 0C85.359 0 110.034 24.6243 110.034 55ZM314.358 100.036C333.455 100.036 345.98 89.7462 345.98 74.2502C345.98 59.8699 336.555 53.0516 322.295 50.6962L309.646 48.5887C299.974 46.9772 293.525 42.7622 293.525 33.4646C293.525 24.043 300.718 16.8529 314.358 16.8529C327.627 16.8529 334.447 23.5472 335.191 33.0927H344.74C343.996 20.448 334.323 9.16685 314.482 9.16685C294.889 9.16685 284.101 20.2 284.101 33.8365C284.101 48.3408 293.897 55.0351 307.29 57.2665L320.063 59.25C330.727 61.1095 336.679 65.4484 336.679 74.6221C336.679 85.4073 327.875 92.3495 314.482 92.3495C300.594 92.3495 291.913 85.6553 291.169 74.2502H281.745C282.489 89.1264 293.897 100.036 314.358 100.036ZM173.574 98.3H138.852V11.0264H172.334C187.091 11.0264 197.383 19.7042 197.383 33.5886C197.383 43.63 191.679 50.3243 182.503 52.5557V52.9276C193.415 55.0351 200.111 62.4732 200.111 74.1262C200.111 89.1264 189.075 98.3 173.574 98.3ZM171.094 49.3326C181.635 49.3326 188.083 43.63 188.083 34.7043V33.4646C188.083 24.5389 181.635 18.9603 171.094 18.9603H148.153V49.3326H171.094ZM172.21 90.366C183.743 90.366 190.811 84.0437 190.811 74.3741V73.1345C190.811 63.093 183.619 57.0186 172.086 57.0186H148.153V90.366H172.21ZM275.216 98.3H265.295L257.855 74.6221H223.133L215.693 98.3H206.268L234.914 11.0264H246.198L275.216 98.3ZM240.99 20.5719H240.246L225.613 66.8121H255.499L240.99 20.5719ZM359.949 98.3V11.0264H416V19.0843H369.25V49.0846H412.28V57.0186H369.25V90.2421H416V98.3H359.949Z" fill="#0052FF"></path>
    </svg>
  </div>
}

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-gray-50 py-3 sm:py-4 px-2 sm:px-6 text-gray-600 mt-auto">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
        <div className="flex gap-4">
          <Links />
        </div>
        <div className="flex justify-center items-center text-center">
          <div className="mr-3 mt-1 text-sm sm:text-base">built on</div>
          <div className="mt-1">
            <a href="https://base.org/" target="_blank">
              <Base />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
