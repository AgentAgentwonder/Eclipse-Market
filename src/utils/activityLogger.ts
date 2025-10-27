import { invoke } from '@tauri-apps/api/tauri'

export type WalletAction = 
  | 'connect'
  | 'disconnect'
  | 'sign'
  | 'send'
  | 'swap'
  | 'approve'
  | 'reject'

export async function logWalletActivity(
  walletAddress: string,
  action: WalletAction,
  details: Record<string, any>,
  result: 'success' | 'failure'
): Promise<void> {
  try {
    await invoke('log_wallet_activity', {
      wallet_address: walletAddress,
      action,
      details,
      result,
    })
  } catch (error) {
    console.error('Failed to log wallet activity:', error)
  }
}

export async function logConnect(walletAddress: string, success: boolean): Promise<void> {
  await logWalletActivity(
    walletAddress,
    'connect',
    { timestamp: new Date().toISOString() },
    success ? 'success' : 'failure'
  )
}

export async function logDisconnect(walletAddress: string): Promise<void> {
  await logWalletActivity(
    walletAddress,
    'disconnect',
    { timestamp: new Date().toISOString() },
    'success'
  )
}

export async function logSign(
  walletAddress: string,
  message: string,
  success: boolean
): Promise<void> {
  await logWalletActivity(
    walletAddress,
    'sign',
    { messageLength: message.length, timestamp: new Date().toISOString() },
    success ? 'success' : 'failure'
  )
}

export async function logSend(
  walletAddress: string,
  recipient: string,
  amount: number,
  token: string,
  success: boolean
): Promise<void> {
  await logWalletActivity(
    walletAddress,
    'send',
    { recipient, amount, token, timestamp: new Date().toISOString() },
    success ? 'success' : 'failure'
  )
}

export async function logSwap(
  walletAddress: string,
  fromToken: string,
  toToken: string,
  fromAmount: number,
  toAmount: number,
  success: boolean
): Promise<void> {
  await logWalletActivity(
    walletAddress,
    'swap',
    { fromToken, toToken, fromAmount, toAmount, timestamp: new Date().toISOString() },
    success ? 'success' : 'failure'
  )
}

export async function logApprove(
  walletAddress: string,
  proposalId: string,
  success: boolean
): Promise<void> {
  await logWalletActivity(
    walletAddress,
    'approve',
    { proposalId, timestamp: new Date().toISOString() },
    success ? 'success' : 'failure'
  )
}

export async function logReject(
  walletAddress: string,
  proposalId: string,
  success: boolean
): Promise<void> {
  await logWalletActivity(
    walletAddress,
    'reject',
    { proposalId, timestamp: new Date().toISOString() },
    success ? 'success' : 'failure'
  )
}
