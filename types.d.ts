declare module 'x402-axios' {
  import { AxiosInstance } from 'axios';

  function withPaymentInterceptor(
    axiosClient: AxiosInstance,
    walletClient: any
  ): AxiosInstance;

  export { withPaymentInterceptor };
}